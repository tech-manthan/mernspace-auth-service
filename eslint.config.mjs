// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
  eslint.configs.recommended,
  //   tseslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // projectService: true,
        tsconfigRootDir: import.meta.dirname,
        project: "./tsconfig.json",
      },
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.test.json",
      },
    },
  },
  {
    ignores: [
      "dist",
      "node_modules",
      "eslint.config.mjs",
      "jest.config.js",
      "scripts",
    ],
  },
  {
    rules: {
      "no-console": "error",
    },
  },
  eslintConfigPrettier,
);
