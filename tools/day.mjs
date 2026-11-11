// Redraw sketches exactly as they played on the page, for picking Instagram posts.
// Usage: node day.mjs <site-dir> <fromK> <toK> <out-dir> [--all]
//   <site-dir> holds etch-core.js, etch-engine.js, batches.json and the batch files it lists.
//   Sketch numbers: use etchKAt(ms) from etch-engine.js (5-minute sketches before sketch 468; from then on 10-minute
//   sketches, and each day also has one 20-minute Daily Super Sketch, see etchIsMaster(k)). Super Sketches are always kept and their name starts with "SUPER ".
//   The last 24 hours: fromK = etchKAt(Date.now() - 86400000), toK = etchKAt(Date.now()) - 1.
//   By default keeps one sketch per subject (its first play in the range); --all keeps every sketch.
// Writes <out-dir>/paths.json (same format draw.py.txt reads, plus k and title). Then:
//   python3 draw.py.txt <out-dir> 3.6   -> 1080x720 PNGs plus contact sheets
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const [dir, a, b, out, flag] = process.argv.slice(2);
if (!dir || !a || !b || !out) { console.error('usage: node day.mjs <site-dir> <fromK> <toK> <out-dir> [--all]'); process.exit(1); }
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'etch-core.js'), 'utf8') + '\n' + fs.readFileSync(path.join(dir, 'etch-engine.js'), 'utf8') + '\n;globalThis.__E={etchEntryFor,etchSlot,ETCH,etchStartMs,etchKAt,etchIsMaster};', ctx);
const { etchEntryFor, etchSlot, ETCH, etchStartMs } = ctx.__E;
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'batches.json'), 'utf8'));
manifest.batches.sort((x, y) => x.startK - y.startK);
const batches = {};
const load = f => { if (!batches[f]) { ctx.ETCH_BATCH = undefined; vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8') + '\n;globalThis.__B=ETCH_BATCH;', ctx); batches[f] = ctx.__B; } return batches[f]; };
fs.mkdirSync(out, { recursive: true });
const seen = new Set(), res = [];
for (let k = Math.max(+a, manifest.archiveStart); k <= +b; k++) {
  const e = etchEntryFor(manifest, k), B = load(e.file), s = etchSlot(B, e.startK, k);
  if (flag !== '--all' && !s.master && seen.has(s.subj.name)) continue; seen.add(s.subj.name);
  const when = new Date(etchStartMs(k)).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  res.push({ k, sketch: '#' + (k + 1).toLocaleString('en-US'), name: (s.master ? 'SUPER ' : '') + s.subj.name, master: !!s.master, title: s.title, when, secs: s.natural, pts: [ETCH.HOME, ...s.moves.map(m => [m.x, m.y])] });
  console.log(`${String(res.length).padStart(3)}. #${k + 1}  ${s.title}  (${s.subj.name}, ${when})`);
}
fs.writeFileSync(path.join(out, 'paths.json'), JSON.stringify(res));
