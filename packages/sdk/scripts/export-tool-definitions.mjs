/**
 * Write public tool definition JSON files for eilcard.com/tool-definitions/
 *
 * Usage:
 *   node packages/sdk/scripts/export-tool-definitions.mjs
 *   node packages/sdk/scripts/export-tool-definitions.mjs --base https://eilcard.com
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');
const outDir = join(repoRoot, 'apps/web/public/tool-definitions');

function parseBase(argv) {
  const idx = argv.indexOf('--base');
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return process.env.EIL_REGISTRY_URL ?? 'https://eilcard.com';
}

async function main() {
  const base = parseBase(process.argv);
  const sdkDist = join(repoRoot, 'packages/sdk/dist/tool-schema-export.js');
  const sdkDistUrl = pathToFileURL(sdkDist).href;

  // Build SDK if dist missing (local dev)
  try {
    await import(sdkDistUrl);
  } catch (err) {
    console.error('[export-tool-definitions] Run: pnpm --filter @digitalcard/sdk build');
    console.error(err);
    process.exit(1);
  }

  const { buildEILResolveToolDefinitions } = await import(sdkDistUrl);
  const defs = buildEILResolveToolDefinitions(base);

  mkdirSync(outDir, { recursive: true });

  const files = {
    'resolve-entity-input.schema.json': defs.jsonSchema,
    'resolve-entity-openai.json': defs.openai,
    'resolve-entity-anthropic.json': defs.anthropic,
    'resolve-entity-gemini.json': defs.gemini,
    'resolve-entity-all.json': {
      registry_base: base,
      generated_at: new Date().toISOString(),
      ...defs,
    },
  };

  for (const [name, data] of Object.entries(files)) {
    const path = join(outDir, name);
    writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${path}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
