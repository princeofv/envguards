// Example environment schema
// This file demonstrates how to define your environment variables

export const envSchema = {
  DATABASE_URL: {
    required: true,
    description: "PostgreSQL connection string",
    example: "postgres://user:pass@localhost:5432/db",
  },

  JWT_SECRET: {
    required: true,
    description: "JWT signing secret for authentication",
  },

  NODE_ENV: {
    required: false,
    default: "development",
    description: "Application environment",
    allowed: ["development", "production", "test"],
  },

  PORT: {
    required: false,
    default: "3000",
    description: "Server port number",
    example: "8080",
  },

  LOG_LEVEL: {
    required: false,
    default: "info",
    description: "Logging verbosity level",
    allowed: ["debug", "info", "warn", "error"],
  },

  API_KEY: {
    required: false,
    description: "External API key",
    example: "sk_live_xxxxx",
  },
};
