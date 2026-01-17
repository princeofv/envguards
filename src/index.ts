/**
 * envguard - Framework-agnostic environment variable validation
 *
 * @packageDocumentation
 */

// Types
export type {
  EnvSchema,
  EnvVarSchema,
  ValidationError,
  ValidationResult,
  ValidateOptions,
} from "./types.js";

// Validation
export { validateEnv, getEnv, isEnvValid } from "./validate.js";

// Generators
export {
  generateMarkdown,
  writeMarkdown,
  type GenerateMarkdownOptions,
} from "./generateMarkdown.js";

export {
  generateEnvExample,
  writeEnvExample,
  type GenerateEnvExampleOptions,
} from "./generateEnvExample.js";

// Schema loading
export { loadSchema, findSchemaFile, getSchemaFilePaths } from "./loadSchema.js";

/**
 * Define an environment schema with type inference
 *
 * @param schema - The environment variable schema
 * @returns The same schema with proper typing
 *
 * @example
 * ```ts
 * import { defineEnvSchema } from "envguard";
 *
 * export const envSchema = defineEnvSchema({
 *   DATABASE_URL: {
 *     required: true,
 *     description: "PostgreSQL connection string",
 *   },
 *   PORT: {
 *     required: false,
 *     default: "3000",
 *   },
 * });
 * ```
 */
export function defineEnvSchema<T extends import("./types.js").EnvSchema>(
  schema: T
): T {
  return schema;
}
