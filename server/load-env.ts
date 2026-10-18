/**
 * Loads `.env.local` and `.env` into `process.env` before anything reads
 * configuration (Next.js did this implicitly). Variables already set by the
 * hosting environment always win, and `.env.local` is read first so it takes
 * precedence over `.env`. Must be the first import of the server entry point:
 * `lib/env.ts` validates the environment as soon as it is imported.
 */
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // A missing file is the normal case on a hosted deployment.
  }
}
