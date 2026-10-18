// Bundles the Express server into dist/server/index.mjs.
//
// Third-party packages stay external (they are installed on the host by
// `npm install`); only the project's own TypeScript — including the `@/`
// path alias — is compiled. The result runs on plain Node with no loader.
import { build } from "esbuild";

await build({
  entryPoints: ["server/index.ts"],
  outfile: "dist/server/index.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  sourcemap: true,
  logLevel: "info",
});
