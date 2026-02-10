import fs from "fs";
import path from "path";
import {app} from "./app.js";

// This script writes the OpenAPI spec to a file.
// This is useful for local development, so the api-client package is regenerated on every change.
// This is needed in CI pipelines, since there is no server to serve the JSON from.

const spec = app.getOpenAPIDocument({
  openapi: "3.1.0",
  info: { title: "Elepad API", version: "1.0.0" },
});

const outputPath = path.resolve(process.cwd(), "openapi.json");

fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`✅ OpenAPI schema generated at ${outputPath}`);
