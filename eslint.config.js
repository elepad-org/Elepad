// eslint.config.ts
import { defineConfig } from "eslint/config";
import js from "@eslint/js"; // ESLint core recommended (flat)
import globals from "globals";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";

export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "apps/*/dist/**",
      "packages/*/dist/**",
      "**/.turbo/**",
      "**/build/**",
      "**/.expo/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      react: reactPlugin,
    },
    rules: {
      ...typescriptPlugin.configs["eslint-recommended"].rules,
      ...typescriptPlugin.configs["recommended"].rules,
      ...reactPlugin.configs.recommended.rules,
      ...(reactPlugin.configs["jsx-runtime"]?.rules ?? {}),
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
]);
