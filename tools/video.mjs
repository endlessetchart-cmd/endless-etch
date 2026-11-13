// Story videos for Endless Etch: renders one sketch exactly as it played on the live page, as a 1080x1920 (9:16) MP4.
// Usage: node video.mjs <site-dir> <k> <live|timelapse> <out.mp4>
//   <site-dir> holds etch-core.js, etch-engine.js, batches.json and the batch files it lists (k = sketch number - 1).
//   live      : 30 seconds at real page speed, taken from the middle of the drawing (the stylus mid-way through).
//   timelapse : the whole sketch, blank to finished, in 27 seconds, then a 3-second hold with the title placard.
// Needs ffmpeg on the PATH and, in the folder you run it from: npm i @napi-rs/canvas @fontsource/ibm-plex-serif @fontsource/ibm-plex-mono
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
const [dir, kArg, mode, out] = process.argv.slice(2);
if (!dir || !kArg || !['live', 'timelapse'].includes(mode) || !out) { console.error('usage: node video.mjs <site-dir> <k> <live|timelapse> <out.mp4>'); process.exit(1); }

// ---- the sketch, planned and timed exactly as index.html does ----
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'etch-core.js'), 'utf8') + '\n' + fs.readFileSync(path.join(dir, 'etch-engine.js'), 'utf8') + '\n;globalThis.__E={etchEntryFor,etchSlot,ETCH,etchSlotSeconds};', ctx);
const E = ctx.__E, manifest = JSON.parse(fs.readFileSync(path.join(dir, 'batches.json'), 'utf8'));
manifest.batches.sort((a, b) => a.startK - b.startK);
const k = +kArg, entry = E.etchEntryFor(manifest, k);
vm.runInContext(fs.readFileSync(path.join(dir, entry.file), 'utf8') + '\n;globalThis.__B=ETCH_BATCH;', ctx);
const sl = E.etchSlot(ctx.__B, entry.startK, k), HOME = E.ETCH.HOME;
let tt = 0, cx = HOME[0], cy = HOME[1]; const cum = [];
for (const m of sl.moves) { tt += Math.max(Math.abs(m.x - cx), Math.abs(m.y - cy)) / (E.ETCH.V * m.m); cx = m.x; cy = m.y; cum.push(tt); }
const len = E.etchSlotSeconds(k), budget = len - E.ETCH.HOLD - E.ETCH.PREWIPE - E.ETCH.ERASE - E.ETCH.REST - 0.5, speed = Math.max(0.4, tt / budget);
const s = { title: sl.title, name: sl.subj.name, moves: sl.moves, cum: cum.map(c => c / speed), dur: tt / speed };

// ---- frame layout (matches site.css: dark ground, recessed powder screen, Plex type) ----
const F = path.resolve('node_modules/@fontsource');
GlobalFonts.registerFromPath(path.join(F, 'ibm-plex-serif/files/ibm-plex-serif-latin-500-italic.woff2'), 'Plex Serif');
GlobalFonts.registerFromPath(path.join(F, 'ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2'), 'Plex Mono');
const W = 1080, H = 1920, FPS = 30, SW = 1000, SH = SW * 2 / 3, SX = (W - SW) / 2, SY = Math.round((H - SH) / 2), SC = SW / 300, R = 26;
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const bg = createCanvas(W, H), b = bg.getContext('2d');
b.fillStyle = '#1e1d1b'; b.fillRect(0, 0, W, H);
b.save(); b.shadowColor = 'rgba(0,0,0,.8)'; b.shadowBlur = 60; b.shadowOffsetY = 30; rr(b, SX, SY, SW, SH, R); b.fillStyle = '#000'; b.fill(); b.restore();
const pw = createCanvas(SW, SH), p = pw.getContext('2d'), lg = p.createLinearGradient(0, 0, SW, SH);
lg.addColorStop(0, '#d0d1cb'); lg.addColorStop(1, '#bcbdb7'); p.fillStyle = lg; p.fillRect(0, 0, SW, SH);
const img = p.getImageData(0, 0, SW, SH), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; } p.putImageData(img, 0, 0);
const rg = p.createRadialGradient(SW / 2, SH / 2, SH * 0.35, SW / 2, SH / 2, SW * 0.62); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(40,40,35,0.16)'); p.fillStyle = rg; p.fillRect(0, 0, SW, SH);
b.save(); rr(b, SX, SY, SW, SH, R); b.clip(); b.drawImage(pw, SX, SY); b.restore();
b.fillStyle = '#d8d4cb'; b.font = '500 italic 46px "Plex Serif"'; b.fillText('Endless Etch', SX, SY - 48);
b.font = '30px "Plex Mono"'; b.fillStyle = '#8b877e'; b.textAlign = 'right'; b.fillText('LIVE', SX + SW, SY - 54); b.textAlign = 'left';
b.fillStyle = '#d8d4cb'; b.beginPath(); b.arc(SX + SW - 92, SY - 64, 8, 0, Math.PI * 2); b.fill();
const ov = createCanvas(W, H), o = ov.getContext('2d');
o.save(); rr(o, SX, SY, SW, SH, R); o.clip();
const gl = o.createLinearGradient(SX, SY, SX + SW * 0.55, SY + SH * 1.1); gl.addColorStop(0, 'rgba(255,255,255,.20)'); gl.addColorStop(0.26, 'rgba(255,255,255,.06)'); gl.addColorStop(0.44, 'rgba(255,255,255,0)'); o.fillStyle = gl; o.fillRect(SX, SY, SW, SH);
o.shadowColor = 'rgba(0,0,0,.35)'; o.shadowBlur = 20; o.shadowOffsetY = 6; o.lineWidth = 40; o.strokeStyle = '#000'; rr(o, SX - 20, SY - 20, SW + 40, SH + 40, R + 20); o.stroke();
o.restore(); o.lineWidth = 2; o.strokeStyle = 'rgba(0,0,0,.6)'; rr(o, SX, SY, SW, SH, R); o.stroke();

// ---- ink, advanced exactly like the page's advanceTo ----
const ink = createCanvas(SW, SH), ik = ink.getContext('2d');
ik.lineWidth = 2.6; ik.lineCap = 'round'; ik.lineJoin = 'round'; ik.strokeStyle = '#3d3e3b';
let mi = 0, pos = { x: HOME[0], y: HOME[1] };
function advanceTo(t) {
  const td = Math.min(t, s.dur); ik.beginPath(); ik.moveTo(pos.x * SC, pos.y * SC); let moved = false;
  while (mi < s.moves.length && s.cum[mi] <= td) { const m = s.moves[mi]; pos = { x: m.x, y: m.y }; ik.lineTo(m.x * SC, m.y * SC); mi++; moved = true; }
  if (mi < s.moves.length) {
    const mm = s.moves[mi], t0 = mi ? s.cum[mi - 1] : 0, t1 = s.cum[mi], f = t1 > t0 ? Math.max(0, Math.min(1, (td - t0) / (t1 - t0))) : 1;
    const px = mi ? s.moves[mi - 1].x : HOME[0], py = mi ? s.moves[mi - 1].y : HOME[1], nx = px + (mm.x - px) * f, ny = py + (mm.y - py) * f;
    if (nx !== pos.x || ny !== pos.y) { pos = { x: nx, y: ny }; ik.lineTo(nx * SC, ny * SC); moved = true; }
  }
  if (moved) ik.stroke();
}
const fr = createCanvas(W, H), g = fr.getContext('2d');
function frame(status, placardAlpha) {
  g.drawImage(bg, 0, 0);
  g.save(); rr(g, SX, SY, SW, SH, R); g.clip(); g.drawImage(ink, SX, SY);
  g.fillStyle = '#262724'; g.beginPath(); g.arc(SX + pos.x * SC, SY + pos.y * SC, 3.4, 0, Math.PI * 2); g.fill(); g.restore();
  g.drawImage(ov, 0, 0);
  g.font = '30px "Plex Mono"'; g.fillStyle = status.bright ? '#d8d4cb' : '#8b877e'; g.fillText(status.text, SX, SY + SH + 70);
  g.textAlign = 'right'; g.fillStyle = '#d8d4cb'; g.fillText('endlessetch.art', SX + SW, SY + SH + 70); g.textAlign = 'left';
  if (placardAlpha > 0) {
    g.save(); g.globalAlpha = placardAlpha; const lift = (1 - placardAlpha) * 10;
    g.font = '500 italic 34px "Plex Serif"'; const tw = g.measureText(s.title).width; g.font = '22px "Plex Mono"'; const mw = g.measureText(s.name).width;
    const w = Math.max(tw, mw) + 44, h = 96, x = SX + SW - w - 30, y = SY + SH - h - 26 + lift;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x + 2, y + 4, w, h); g.fillStyle = '#f3f1ea'; g.fillRect(x, y, w, h);
    g.fillStyle = '#2b2a27'; g.font = '500 italic 34px "Plex Serif"'; g.fillText(s.title, x + 22, y + 44);
    g.fillStyle = '#6f6c64'; g.font = '22px "Plex Mono"'; g.fillText(s.name, x + 22, y + 76); g.restore();
  }
}

// ---- encode ----
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
async function emit() { const buf = Buffer.from(g.getImageData(0, 0, W, H).data.buffer); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
const pct = t => Math.floor(Math.min(t, s.dur) / s.dur * 100);
if (mode === 'live') {
  const LEN = 30, start = Math.max(0, s.dur / 2 - LEN / 2); advanceTo(start);
  for (let i = 0; i < LEN * FPS; i++) { const t = start + i / FPS; advanceTo(t); frame({ text: 'Drawing… ' + pct(t) + '%' }, 0); await emit(); }
  console.log(`live: ${s.name} "${s.title}" (sketch #${k + 1}), ${start.toFixed(0)}–${(start + LEN).toFixed(0)}s of ${s.dur.toFixed(0)}s -> ${out}`);
} else {
  const DRAW = 27, HOLD = 3, x = Math.round(s.dur / DRAW);
  for (let i = 0; i < (DRAW + HOLD) * FPS; i++) {
    const sec = i / FPS, t = Math.min(s.dur, sec / DRAW * s.dur); advanceTo(t);
    if (sec < DRAW) frame({ text: 'Drawing… ' + pct(t) + '%  ·  ' + x + '× speed' }, 0);
    else frame({ text: s.title + ' · finished', bright: true }, Math.min(1, (sec - DRAW) / 0.6));
    await emit();
  }
  console.log(`timelapse: ${s.name} "${s.title}" (sketch #${k + 1}), whole sketch at ${x}x -> ${out}`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r));
