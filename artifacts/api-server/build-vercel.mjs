import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { execSync } from "node:child_process";
import { mkdir, rm, cp, writeFile } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const apiServerDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(apiServerDir, "../..");
const frontendDist = path.resolve(rootDir, "artifacts/localscene/dist/public");

const outputDir = path.resolve(rootDir, ".vercel/output");
const staticDir = path.resolve(outputDir, "static");
const funcDir = path.resolve(outputDir, "functions/api/index.func");

console.log("--- Building frontend (localscene) ---");
execSync("pnpm --filter @workspace/localscene run build", {
  cwd: rootDir,
  stdio: "inherit",
  env: { ...process.env, PORT: "5173", BASE_PATH: "/" },
});

console.log("--- Assembling Build Output API v3 directory ---");
await rm(outputDir, { recursive: true, force: true });
await mkdir(staticDir, { recursive: true });
await mkdir(funcDir, { recursive: true });
await cp(frontendDist, staticDir, { recursive: true });

console.log("--- Bundling API handler for Vercel serverless function ---");
await esbuild({
  entryPoints: [path.resolve(apiServerDir, "src/handler.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: path.resolve(funcDir, "index.mjs"),
  logLevel: "info",
  external: [
    "*.node",
    "sharp", "better-sqlite3", "sqlite3", "canvas", "bcrypt", "argon2",
    "fsevents", "re2", "farmhash", "xxhash-addon", "bufferutil",
    "utf-8-validate", "ssh2", "cpu-features", "dtrace-provider",
    "isolated-vm", "lightningcss", "pg-native", "oracledb",
    "mongodb-client-encryption", "nodemailer", "handlebars", "knex",
    "typeorm", "protobufjs", "onnxruntime-node", "@tensorflow/*",
    "@prisma/client", "@mikro-orm/*", "@grpc/*", "@swc/*", "@aws-sdk/*",
    "@azure/*", "@opentelemetry/*", "@google-cloud/*", "@google/*",
    "googleapis", "firebase-admin", "@parcel/watcher",
    "@sentry/profiling-node", "@tree-sitter/*", "aws-sdk", "classic-level",
    "dd-trace", "ffi-napi", "grpc", "hiredis", "kerberos", "leveldown",
    "miniflare", "mysql2", "newrelic", "odbc", "piscina", "realm",
    "ref-napi", "rocksdb", "sass-embedded", "sequelize", "serialport",
    "snappy", "tinypool", "usb", "workerd", "wrangler", "zeromq",
    "zeromq-prebuilt", "playwright", "puppeteer", "puppeteer-core", "electron",
  ],
  banner: {
    js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`,
  },
});

await writeFile(
  path.resolve(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: true,
    },
    null,
    2,
  ),
);

await writeFile(
  path.resolve(outputDir, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "^/api(?:/.*)?$", dest: "/api/index" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);

console.log("--- Done ---");
