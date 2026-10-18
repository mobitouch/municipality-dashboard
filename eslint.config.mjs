import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Form actions all share the (prevState, formData) signature required
      // by useActionState/form-action bindings, so unused parameters are
      // routine — e.g. an action with no form fields still takes formData.
      // A leading underscore is the project's marker for "intentionally
      // unused".
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
