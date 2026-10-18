// Production entry point (`npm start`, and the "entry file" on hosts such as
// Hostinger). It only sets NODE_ENV before the bundled server loads, because
// the environment is validated the moment `lib/env` is first imported.
process.env.NODE_ENV ??= "production";

await import("./dist/server/index.mjs");
