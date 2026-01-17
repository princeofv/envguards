import type {
  EnvSchema,
  ValidationError,
  ValidationResult,
  ValidateOptions,
} from "./types.js";

/**
 * ANSI color codes for terminal output
 */
const colors = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

/**
 * Format validation errors for console output
 */
function formatErrors(errors: ValidationError[]): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(
    `${colors.red}${colors.bold}❌ Environment validation failed${colors.reset}`
  );
  lines.push("");

  for (const error of errors) {
    lines.push(`${colors.red}❌ ${error.message}${colors.reset}`);

    if (error.description) {
      lines.push(`${colors.cyan}ℹ️  ${error.description}${colors.reset}`);
    }

    if (error.expected && error.expected.length > 0) {
      lines.push(
        `${colors.gray}   Allowed values: ${error.expected.join(", ")}${colors.reset}`
      );
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Validates environment variables against a schema
 *
 * @param schema - The environment variable schema
 * @param options - Validation options
 * @returns Validation result with values and any errors
 * @throws Error if validation fails and throwOnError is true
 *
 * @example
 * ```ts
 * import { validateEnv } from "envguard";
 *
 * const schema = {
 *   DATABASE_URL: { required: true, description: "Database connection string" },
 *   PORT: { required: false, default: "3000" }
 * };
 *
 * validateEnv(schema);
 * ```
 */
export function validateEnv(
  schema: EnvSchema,
  options: ValidateOptions = {}
): ValidationResult {
  const { env = process.env, throwOnError = true } = options;
  const errors: ValidationError[] = [];
  const values: Record<string, string | undefined> = {};

  for (const [key, config] of Object.entries(schema)) {
    const value = env[key];
    const isRequired = config.required === true;
    const hasDefault = config.default !== undefined;
    const hasValue = value !== undefined && value !== "";

    // Get the effective value (env value or default)
    const effectiveValue = hasValue ? value : config.default;
    values[key] = effectiveValue;

    // Check required
    if (isRequired && !hasValue && !hasDefault) {
      errors.push({
        variable: key,
        message: `Missing environment variable: ${key}`,
        description: config.description,
        expected: config.allowed,
      });
      continue;
    }

    // Check allowed values
    if (
      config.allowed &&
      config.allowed.length > 0 &&
      effectiveValue !== undefined
    ) {
      if (!config.allowed.includes(effectiveValue)) {
        errors.push({
          variable: key,
          message: `Invalid value for ${key}: "${effectiveValue}"`,
          description: config.description,
          expected: config.allowed,
        });
      }
    }
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
    values,
  };

  if (!result.valid && throwOnError) {
    const errorMessage = formatErrors(errors);
    console.error(errorMessage);
    throw new Error(`Environment validation failed: ${errors.length} error(s)`);
  }

  return result;
}

/**
 * Get a single validated environment variable value
 *
 * @param schema - The environment variable schema
 * @param key - The variable name to retrieve
 * @param options - Validation options
 * @returns The variable value or undefined
 */
export function getEnv(
  schema: EnvSchema,
  key: string,
  options: ValidateOptions = {}
): string | undefined {
  const result = validateEnv(schema, { ...options, throwOnError: false });
  return result.values[key];
}

/**
 * Check if all environment variables are valid without throwing
 *
 * @param schema - The environment variable schema
 * @param options - Validation options
 * @returns True if all variables are valid
 */
export function isEnvValid(
  schema: EnvSchema,
  options: ValidateOptions = {}
): boolean {
  const result = validateEnv(schema, { ...options, throwOnError: false });
  return result.valid;
}
