#!/usr/bin/env node

import { loadSchema, findSchemaFile, getSchemaFilePaths } from "./loadSchema.js";
import { writeMarkdown } from "./generateMarkdown.js";
import { writeEnvExample } from "./generateEnvExample.js";
import { validateEnv } from "./validate.js";

/**
 * ANSI color codes for terminal output
 */
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

/**
 * Print styled message
 */
function log(message: string): void {
  console.log(message);
}

function success(message: string): void {
  console.log(`${colors.green}✔${colors.reset} ${message}`);
}

function error(message: string): void {
  console.error(`${colors.red}✖${colors.reset} ${message}`);
}

function info(message: string): void {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

/**
 * Print CLI banner
 */
function printBanner(): void {
  log("");
  log(`${colors.bold}${colors.cyan}envguard${colors.reset} - Environment Variable Guardian`);
  log("");
}

/**
 * Print help message
 */
function printHelp(): void {
  printBanner();
  log(`${colors.bold}Usage:${colors.reset}`);
  log("  envguard <command> [options]");
  log("");
  log(`${colors.bold}Commands:${colors.reset}`);
  log("  generate    Generate ENVIRONMENT.md and .env.example files");
  log("  check       Validate environment variables against schema");
  log("  help        Show this help message");
  log("");
  log(`${colors.bold}Options:${colors.reset}`);
  log("  --schema <path>     Path to schema file (auto-detected by default)");
  log("  --cwd <path>        Working directory (default: current directory)");
  log("  --md-file <name>    Output markdown file name (default: ENVIRONMENT.md)");
  log("  --env-file <name>   Output .env.example file name (default: .env.example)");
  log("  --no-comments       Don't include comments in .env.example");
  log("  --group             Group variables by required/optional in .env.example");
  log("  -h, --help          Show this help message");
  log("  -v, --version       Show version number");
  log("");
  log(`${colors.bold}Examples:${colors.reset}`);
  log("  npx envguard generate");
  log("  npx envguard check");
  log("  npx envguard generate --schema ./config/env.schema.js");
  log("  npx envguard check --cwd ./packages/api");
  log("");
  log(`${colors.bold}Schema file names (auto-detected):${colors.reset}`);
  for (const file of getSchemaFilePaths()) {
    log(`  - ${file}`);
  }
  log("");
}

/**
 * Print version
 */
function printVersion(): void {
  // Version is read from package.json during build
  log("envguard v1.0.0");
}

/**
 * Parse command line arguments
 */
interface CliArgs {
  command: string;
  schema?: string;
  cwd: string;
  mdFile: string;
  envFile: string;
  includeComments: boolean;
  groupByRequired: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    command: "",
    cwd: process.cwd(),
    mdFile: "ENVIRONMENT.md",
    envFile: ".env.example",
    includeComments: true,
    groupByRequired: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--schema" && args[i + 1]) {
      result.schema = args[++i];
    } else if (arg === "--cwd" && args[i + 1]) {
      result.cwd = args[++i];
    } else if (arg === "--md-file" && args[i + 1]) {
      result.mdFile = args[++i];
    } else if (arg === "--env-file" && args[i + 1]) {
      result.envFile = args[++i];
    } else if (arg === "--no-comments") {
      result.includeComments = false;
    } else if (arg === "--group") {
      result.groupByRequired = true;
    } else if (arg === "-h" || arg === "--help") {
      result.command = "help";
    } else if (arg === "-v" || arg === "--version") {
      result.command = "version";
    } else if (!arg.startsWith("-") && !result.command) {
      result.command = arg;
    }

    i++;
  }

  return result;
}

/**
 * Generate command - creates ENVIRONMENT.md and .env.example
 */
async function commandGenerate(args: CliArgs): Promise<number> {
  printBanner();

  try {
    // Find and load schema
    const schemaPath = args.schema
      ? args.schema
      : findSchemaFile(args.cwd);

    if (!schemaPath) {
      error("Could not find schema file!");
      log("");
      info("Create one of these files with your schema:");
      for (const file of getSchemaFilePaths()) {
        log(`  ${colors.gray}- ${file}${colors.reset}`);
      }
      log("");
      info("Or specify a path with --schema <path>");
      return 1;
    }

    info(`Loading schema from ${colors.cyan}${schemaPath}${colors.reset}`);

    const schema = await loadSchema(args.schema, args.cwd);
    const varCount = Object.keys(schema).length;
    success(`Found ${varCount} environment variable(s)`);

    // Generate markdown
    writeMarkdown(schema, {
      outputFile: args.mdFile,
      cwd: args.cwd,
    });
    success(`Generated ${colors.cyan}${args.mdFile}${colors.reset}`);

    // Generate .env.example
    writeEnvExample(schema, {
      outputFile: args.envFile,
      cwd: args.cwd,
      includeComments: args.includeComments,
      groupByRequired: args.groupByRequired,
    });
    success(`Generated ${colors.cyan}${args.envFile}${colors.reset}`);

    log("");
    success("Done! Files generated successfully.");
    log("");

    return 0;
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}

/**
 * Check command - validates environment variables
 */
async function commandCheck(args: CliArgs): Promise<number> {
  printBanner();

  try {
    // Find and load schema
    const schemaPath = args.schema
      ? args.schema
      : findSchemaFile(args.cwd);

    if (!schemaPath) {
      error("Could not find schema file!");
      log("");
      info("Create one of these files with your schema:");
      for (const file of getSchemaFilePaths()) {
        log(`  ${colors.gray}- ${file}${colors.reset}`);
      }
      return 1;
    }

    info(`Loading schema from ${colors.cyan}${schemaPath}${colors.reset}`);

    const schema = await loadSchema(args.schema, args.cwd);
    const varCount = Object.keys(schema).length;
    info(`Checking ${varCount} environment variable(s)...`);
    log("");

    // Validate - this will throw if invalid
    const result = validateEnv(schema, { throwOnError: false });

    if (result.valid) {
      success("All environment variables are valid!");
      log("");
      return 0;
    } else {
      // Print errors
      for (const err of result.errors) {
        error(err.message);
        if (err.description) {
          info(err.description);
        }
        if (err.expected && err.expected.length > 0) {
          log(`  ${colors.gray}Allowed values: ${err.expected.join(", ")}${colors.reset}`);
        }
        log("");
      }

      error(`Validation failed with ${result.errors.length} error(s)`);
      return 1;
    }
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  let exitCode = 0;

  switch (args.command) {
    case "generate":
      exitCode = await commandGenerate(args);
      break;

    case "check":
      exitCode = await commandCheck(args);
      break;

    case "version":
      printVersion();
      break;

    case "help":
    case "":
      printHelp();
      break;

    default:
      error(`Unknown command: ${args.command}`);
      log("");
      printHelp();
      exitCode = 1;
      break;
  }

  process.exit(exitCode);
}

// Run CLI
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
