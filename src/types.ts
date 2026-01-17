/**
 * Schema definition for a single environment variable
 */
export interface EnvVarSchema {
  /** Whether this variable is required */
  required?: boolean;
  /** Human-readable description of the variable */
  description?: string;
  /** Example value for documentation */
  example?: string;
  /** Default value if not provided */
  default?: string;
  /** Allowed values (enum validation) */
  allowed?: string[];
}

/**
 * Schema definition for all environment variables
 */
export interface EnvSchema {
  [key: string]: EnvVarSchema;
}

/**
 * Validation error details
 */
export interface ValidationError {
  variable: string;
  message: string;
  description?: string;
  expected?: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  values: Record<string, string | undefined>;
}

/**
 * Options for validation
 */
export interface ValidateOptions {
  /** Custom environment object (defaults to process.env) */
  env?: Record<string, string | undefined>;
  /** Whether to throw on validation errors (default: true) */
  throwOnError?: boolean;
}
