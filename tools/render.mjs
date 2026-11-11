// Review tool for Endless Etch batches.
// Usage: node render.mjs <etch-core.js> <batch.js> <out-dir>
// Plans every subject exactly as the page does, writes paths.json and prints a stats table.
// Budget: 1190s per sketch (20-minute sketches; aim for 800-1100s natural). Set BUDGET=290 to review the old 5-minute batch 1.
// Then run: python3 draw.py <out-dir>  to get one PNG per subject plus contact sheets.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const [core, batch, out] = process.argv.slice(2);
if (!core || !batch || !out) { console.error('usage: node render.mjs <etch-core.js> <batch.js> <out-dir>'); process.exit(1); }
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(core, 'utf8') + '\n' + fs.readFileSync(batch, 'utf8') + '\n;globalThis.__B=ETCH_BATCH;globalThis.__plan=plan;globalThis.__secs=pathSeconds;globalThis.__rng=rng;globalThis.__hash=hashStr;', ctx);
const B = ctx.__B, HOME = [150, 194], V = 48, BUDGET = +(process.env.BUDGET || 1190);
fs.mkdirSync(out, { recursive: true });
const res = [];
console.log(`Batch ${B.number}: ${B.subjects.length} subjects`);
for (const s of B.subjects) {
  const t0 = Date.now(); let strokes;
  try { strokes = s.build(ctx.__rng(ctx.__hash(s.name))); } catch (e) { console.log(`${s.name}: BUILD ERROR ${e.message}`); continue; }
  const p = ctx.__plan(strokes, HOME), secs = ctx.__secs(p.moves, HOME, V);
  const pts = [HOME, ...p.moves.map(m => [m.x, m.y])];
  res.push({ name: s.name, secs, bridge: p.bridge, strokes: strokes.length, planMs: Date.now() - t0, pts });
  console.log(`${s.name.padEnd(24)} strokes ${String(strokes.length).padStart(4)}  natural ${secs.toFixed(0).padStart(4)}s (budget ${BUDGET}s)  new-ink bridges ${p.bridge.toFixed(0).padStart(4)}  plan ${Date.now() - t0}ms`);
}
fs.writeFileSync(path.join(out, 'paths.json'), JSON.stringify(res));
