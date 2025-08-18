import fs from "fs";
import path from "path";
import app from "../src/app.js";

const spec = app.getOpenAPIDocument({
  openapi: "3.1.0",
  info: { title: "Elepad API", version: "1.0.0" },
});

const outputPath = path.resolve(process.cwd(), "openapi.json");

fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`✅ OpenAPI schema generated at ${outputPath}`);
