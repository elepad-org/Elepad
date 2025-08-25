import fs from "fs";
import path from "path";
import app from "./app.js";

// This script is called in package.json when running `npm run build`.

const spec = app.getOpenAPIDocument({
  openapi: "3.1.0",
  info: { title: "Elepad API", version: "1.0.0" },
});

// Write the OpenAPI spec to a file.
// This is needed in CI pipelines, as we cannot serve the spec directly from the app.
const outputPath = path.resolve(process.cwd(), "openapi.json");

fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`✅ OpenAPI schema generated at ${outputPath}`);
