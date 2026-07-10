// Vercel serverless entry point. dist/app.js (built via `pnpm build` / `npm
// run build`) is a genuine ES module (package.json has "type": "module"),
// so it must be loaded with a real dynamic import — require() cannot load
// ESM at all (this broke at runtime despite working under tsx locally,
// which fakes CJS/ESM interop that Node's real require() doesn't provide).
// Top-level await is valid in ESM and Vercel's Node.js runtime supports it.
import type { Express } from "express";

// @ts-expect-error -- dist/ has no .d.ts (declaration emit hits an unrelated
// pnpm-path type-portability error across the route tree, see build notes).
const { createApp }: { createApp: () => Express } = await import("../dist/app.js");

const app = createApp();

export default app;
