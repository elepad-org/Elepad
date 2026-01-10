import { defineConfig } from "eslint/config";
import globals from "globals";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import gitignore from "eslint-config-flat-gitignore";

export default defineConfig([
  gitignore(),
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
      "react/prop-types": "off", // TypeScript ya provee validación de tipos
    },
    settings: {
      react: { version: "detect" },
    },
  },
]);
