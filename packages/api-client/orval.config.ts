import { defineConfig } from "orval";

export default defineConfig({
  elepad: {
    input:
      process.env.NODE_ENV === "development"
        ? "http://localhost:8787/api/openapi.json"
        : "../../apps/api/openapi.json",
    output: {
      target: "src/gen/client.ts",
      client: "react-query",
      httpClient: "fetch",
      override: {
        mutator: {
          path: "src/mutator.ts",
          name: "rnFetch",
        },
      },
    },
  },
});
