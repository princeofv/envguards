# envguard

> 🛡️ Framework-agnostic environment variable validation, documentation generator, and `.env.example` creator.

[![npm version](https://img.shields.io/npm/v/envguard.svg)](https://www.npmjs.com/package/envguard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why envguard?

Managing environment variables across different frameworks and environments is painful:

- ❌ **Silent failures** - Missing env vars cause cryptic runtime errors
- ❌ **No documentation** - Team members don't know what variables are needed
- ❌ **Copy-paste errors** - Setting up new environments is error-prone
- ❌ **Framework lock-in** - Most validation tools are framework-specific

**envguard** solves all of this with a single, framework-agnostic solution:

- ✅ **Fail fast** - Clear error messages at startup
- ✅ **Auto-documentation** - Generate Markdown docs from your schema
- ✅ **Auto `.env.example`** - Keep your example file in sync
- ✅ **Works everywhere** - Node, Express, React, Next.js, Vite, Angular, Svelte, Bun, Deno

## Installation

```bash
npm install envguard
```

```bash
yarn add envguard
```

```bash
pnpm add envguard
```

## Quick Start

### 1. Define your schema

Create an `env.schema.js` (or `env.schema.ts`) file:

```typescript
// env.schema.ts
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
};
```

### 2. Validate at runtime

```typescript
import { validateEnv } from "envguard";
import { envSchema } from "./env.schema.js";

// Validates and throws if invalid
validateEnv(envSchema);

// Your app starts only if all env vars are valid!
console.log("✅ Environment validated, starting server...");
```

### 3. Generate documentation

```bash
npx envguard generate
```

This creates:
- `ENVIRONMENT.md` - Markdown documentation
- `.env.example` - Example environment file

## Schema Definition

Each environment variable can have these properties:

| Property | Type | Description |
|----------|------|-------------|
| `required` | `boolean` | If `true`, validation fails when variable is missing |
| `description` | `string` | Human-readable description (used in docs) |
| `example` | `string` | Example value (used in docs and `.env.example`) |
| `default` | `string` | Default value if not provided |
| `allowed` | `string[]` | List of allowed values (enum validation) |

```typescript
import { defineEnvSchema } from "envguard";

export const envSchema = defineEnvSchema({
  // Required with description and example
  API_KEY: {
    required: true,
    description: "API key for external service",
    example: "sk_live_xxxxx",
  },

  // Optional with default
  CACHE_TTL: {
    required: false,
    default: "3600",
    description: "Cache time-to-live in seconds",
  },

  // Enum validation
  LOG_FORMAT: {
    required: false,
    default: "json",
    allowed: ["json", "pretty", "compact"],
    description: "Log output format",
  },
});
```

## CLI Commands

### `envguard generate`

Generates documentation and example files from your schema.

```bash
npx envguard generate
```

**Options:**
- `--schema <path>` - Path to schema file (auto-detected by default)
- `--cwd <path>` - Working directory
- `--md-file <name>` - Output markdown file name (default: `ENVIRONMENT.md`)
- `--env-file <name>` - Output env file name (default: `.env.example`)
- `--no-comments` - Don't include comments in `.env.example`
- `--group` - Group variables by required/optional

### `envguard check`

Validates current environment against the schema. Exits with code `1` on error (CI-friendly).

```bash
npx envguard check
```

**Options:**
- `--schema <path>` - Path to schema file
- `--cwd <path>` - Working directory

## Generated Output

### ENVIRONMENT.md

```markdown
# Environment Variables

This document describes all environment variables used by this application.

| Name | Required | Default | Description | Example |
|------|----------|---------|-------------|---------|
| `DATABASE_URL` | ✅ | `—` | PostgreSQL connection string | postgres://... |
| `JWT_SECRET` | ✅ | `—` | JWT signing secret | — |
| `NODE_ENV` | ❌ | `development` | Application environment | development |
| `PORT` | ❌ | `3000` | Server port number | 8080 |

## Allowed Values

### `NODE_ENV`

- `development`
- `production`
- `test`
```

### .env.example

```bash
# Environment Variables
# Generated by envguard

# PostgreSQL connection string
# [REQUIRED]
DATABASE_URL=

# JWT signing secret for authentication
# [REQUIRED]
JWT_SECRET=

# Application environment
# Allowed values: development, production, test
NODE_ENV=development

# Server port number
PORT=3000
```

## Framework Examples

### Node.js / Express

```typescript
// src/index.ts
import express from "express";
import { validateEnv } from "envguard";
import { envSchema } from "./env.schema.js";

// Validate before anything else
validateEnv(envSchema);

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### React / Vite

```typescript
// src/env.ts
import { validateEnv } from "envguard";

const envSchema = {
  VITE_API_URL: {
    required: true,
    description: "Backend API URL",
    example: "https://api.example.com",
  },
  VITE_APP_TITLE: {
    required: false,
    default: "My App",
    description: "Application title",
  },
};

// Validate on app load
validateEnv(envSchema, { env: import.meta.env });

export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  appTitle: import.meta.env.VITE_APP_TITLE,
};
```

### Next.js

```typescript
// lib/env.ts
import { validateEnv } from "envguard";

const envSchema = {
  DATABASE_URL: {
    required: true,
    description: "Database connection string",
  },
  NEXTAUTH_SECRET: {
    required: true,
    description: "NextAuth.js secret",
  },
  NEXTAUTH_URL: {
    required: false,
    default: "http://localhost:3000",
    description: "NextAuth.js URL",
  },
};

// Validate server-side environment
validateEnv(envSchema);

// For client-side (NEXT_PUBLIC_ vars)
const clientEnvSchema = {
  NEXT_PUBLIC_API_URL: {
    required: true,
    description: "Public API URL",
  },
};

// Validate in a client component or layout
if (typeof window !== "undefined") {
  validateEnv(clientEnvSchema);
}
```

### Angular

```typescript
// src/environments/env.validator.ts
import { validateEnv } from "envguard";

const envSchema = {
  NG_APP_API_URL: {
    required: true,
    description: "Backend API URL",
  },
  NG_APP_ENV: {
    required: false,
    default: "development",
    allowed: ["development", "production"],
  },
};

// Call during app initialization
export function validateEnvironment(): void {
  validateEnv(envSchema);
}
```

### Bun / Deno

```typescript
// env.ts
import { validateEnv } from "envguard";

const envSchema = {
  PORT: {
    required: false,
    default: "3000",
  },
  DATABASE_URL: {
    required: true,
    description: "Database connection string",
  },
};

validateEnv(envSchema);

// Works with both Bun and Deno (Node-compat mode)
```

## API Reference

### `validateEnv(schema, options?)`

Validates environment variables against a schema.

```typescript
import { validateEnv } from "envguard";

const result = validateEnv(schema, {
  env: process.env,      // Custom env object (default: process.env)
  throwOnError: true,    // Throw on validation error (default: true)
});
```

**Returns:** `ValidationResult`
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  values: Record<string, string | undefined>;
}
```

### `isEnvValid(schema, options?)`

Check if environment is valid without throwing.

```typescript
import { isEnvValid } from "envguard";

if (!isEnvValid(schema)) {
  console.error("Invalid environment!");
  process.exit(1);
}
```

### `getEnv(schema, key, options?)`

Get a single validated environment variable value.

```typescript
import { getEnv } from "envguard";

const dbUrl = getEnv(schema, "DATABASE_URL");
```

### `generateMarkdown(schema, options?)`

Generate markdown documentation string.

```typescript
import { generateMarkdown } from "envguard";

const markdown = generateMarkdown(schema, {
  title: "Environment Variables",
});
```

### `generateEnvExample(schema, options?)`

Generate `.env.example` content string.

```typescript
import { generateEnvExample } from "envguard";

const content = generateEnvExample(schema, {
  includeComments: true,
  groupByRequired: false,
});
```

### `defineEnvSchema(schema)`

Type helper for defining schemas with inference.

```typescript
import { defineEnvSchema } from "envguard";

export const envSchema = defineEnvSchema({
  DATABASE_URL: { required: true },
});
```

## Error Messages

When validation fails, you get clear, actionable error messages:

```
❌ Environment validation failed

❌ Missing environment variable: DATABASE_URL
ℹ️  PostgreSQL connection string

❌ Invalid value for NODE_ENV: "invalid"
ℹ️  Application environment
   Allowed values: development, production, test
```

## CI/CD Integration

Use the `check` command in your CI pipeline:

```yaml
# GitHub Actions
- name: Validate environment
  run: npx envguard check
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

```yaml
# GitLab CI
validate-env:
  script:
    - npx envguard check
```

The command exits with code `1` on validation failure, failing your CI build.

## TypeScript Support

envguard is written in TypeScript and provides full type definitions:

```typescript
import type { EnvSchema, EnvVarSchema, ValidationResult } from "envguard";

const schema: EnvSchema = {
  MY_VAR: {
    required: true,
    description: "My variable",
  } satisfies EnvVarSchema,
};
```

## Schema File Locations

The CLI auto-detects schema files in this order:

1. `env.schema.ts`
2. `env.schema.js`
3. `env.schema.mjs`
4. `env.schema.cjs`
5. `envguard.config.ts`
6. `envguard.config.js`
7. `envguard.config.mjs`
8. `envguard.config.cjs`

Or specify a custom path:

```bash
npx envguard generate --schema ./config/env.schema.js
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs.

## License

MIT © [Your Name]

---

Made with ❤️ for better developer experience.
