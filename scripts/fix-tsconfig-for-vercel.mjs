import fs from "fs";
import path from "path";

const tsconfigPath = path.resolve("tsconfig.json");
const isVercel = process.env.VERCEL;

if (isVercel && fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
  tsconfig.compilerOptions.ignoreDeprecations = true;
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  console.log("Patched tsconfig.json for Vercel TypeScript compatibility.");
}