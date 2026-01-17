import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { EnvSchema } from "./types.js";

/**
 * Possible schema file names to search for
 */
const SCHEMA_FILE_NAMES = [
  "env.schema.ts",
  "env.schema.js",
  "env.schema.mjs",
  "env.schema.cjs",
  "envguard.config.ts",
  "envguard.config.js",
  "envguard.config.mjs",
  "envguard.config.cjs",
];

/**
 * Possible schema export names
 */
const SCHEMA_EXPORT_NAMES = ["envSchema", "schema", "default"];

/**
 * Find the schema file in the given directory
 */
export function findSchemaFile(cwd: string = process.cwd()): string | null {
  for (const fileName of SCHEMA_FILE_NAMES) {
    const filePath = join(cwd, fileName);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Load and return the environment schema from a file
 *
 * @param filePath - Optional explicit path to schema file
 * @param cwd - Working directory to search in
 * @returns The loaded schema
 * @throws Error if schema file not found or invalid
 */
export async function loadSchema(
  filePath?: string,
  cwd: string = process.cwd()
): Promise<EnvSchema> {
  const schemaPath = filePath ? resolve(cwd, filePath) : findSchemaFile(cwd);

  if (!schemaPath) {
    throw new Error(
      `Could not find schema file. Looked for:\n${SCHEMA_FILE_NAMES.map((f) => `  - ${f}`).join("\n")}\n\nCreate one of these files with your schema, or specify a path with --schema`
    );
  }

  if (!existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  try {
    // Convert to file URL for ESM imports on Windows
    const fileUrl = pathToFileURL(schemaPath).href;

    // Dynamic import for ESM/CJS compatibility
    const module = await import(fileUrl);

    // Try to find the schema export
    for (const exportName of SCHEMA_EXPORT_NAMES) {
      if (module[exportName] && typeof module[exportName] === "object") {
        return module[exportName] as EnvSchema;
      }
    }

    // If module itself looks like a schema (has string keys with object values)
    if (isValidSchema(module)) {
      return module as EnvSchema;
    }

    throw new Error(
      `Schema file does not export a valid schema. Expected export named: ${SCHEMA_EXPORT_NAMES.join(", ")}`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("does not export")) {
      throw error;
    }

    // Handle TypeScript files - suggest compilation
    if (schemaPath.endsWith(".ts")) {
      throw new Error(
        `Could not load TypeScript schema file: ${schemaPath}\n\n` +
          `Make sure you have either:\n` +
          `  1. Compiled your schema to JavaScript\n` +
          `  2. Using a runtime that supports TypeScript (tsx, ts-node, bun)\n` +
          `  3. Or use a .js schema file instead\n\n` +
          `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    throw new Error(
      `Failed to load schema file: ${schemaPath}\n${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if an object looks like a valid EnvSchema
 */
function isValidSchema(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;

  const entries = Object.entries(obj);
  if (entries.length === 0) return false;

  // Check that all values are objects (schema definitions)
  return entries.every(
    ([key, value]) =>
      typeof key === "string" &&
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

/**
 * Get all possible schema file paths for display
 */
export function getSchemaFilePaths(): string[] {
  return [...SCHEMA_FILE_NAMES];
}
