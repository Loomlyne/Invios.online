import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "public/**",
    "supabase/**",
    "next-env.d.ts",
  ]),
]);
