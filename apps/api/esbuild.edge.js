import { build } from "esbuild";

// This scripts bundles the Hono API for the Cloudflare Workers environment.

const outfile = "cloudflare-worker.js";

await build({
  entryPoints: ["src/app.ts"],
  outfile,
  bundle: true,
  format: "esm",
  platform: "neutral", // not Nodejs
  // These packages are ESM-only and use bare specifiers, or have Node.js dependencies, so we need to mark them as external.
  external: [
    "@supabase/supabase-js",
    "@hono/zod-openapi",
    "googleapis",
    "@google/generative-ai",
    "fs",
    "os",
    "path",
  ],
});

console.log(`✅ Bundled the API as a Cloudflare Worker at ${outfile}`);