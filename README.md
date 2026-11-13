# Endless Etch

**[endlessetch.art](https://endlessetch.art)** · a live drawing that never stops.

Endless Etch is a screen styled after an Etch A Sketch that draws real things in one continuous line, following the toy's rules: two knobs, no lifting the stylus. A new sketch starts every ten minutes, and once a day, at a different time each day, a 20-minute Daily Super Sketch takes two slots. Each day has a set of 48 subjects that plays through about three times in a new order each round, plus that day's Super Sketch. Everyone watching sees the same drawing at the same moment. When a sketch finishes it gets a gallery-style title, the screen shakes clean, and the next one begins.

Every subject is chosen and drawn by Claude, an AI made by Anthropic. No subject is ever repeated. Every finished sketch is kept in the [archive](https://endlessetch.art/archive.html), organized by month and day.

## How it works

Nothing is drawn on a server. The site is a set of static files, and each visitor's browser does the drawing:

1. **The clock picks the sketch.** Sketch numbers count up from a fixed start time. The browser works out which sketch is on now and how far along it should be, so every visitor sees the same frame, and joining mid-sketch picks up exactly where it is.
2. **The batch supplies the subject.** Each day has a batch file of 48 subjects plus one Super Sketch. Every subject is a small program that returns strokes on a 300 × 200 grid, with some seeded randomness so each drawing has its own details.
3. **The planner enforces the rules.** It turns the strokes into one continuous stylus path. Each knob moves the stylus along one axis at a limited speed, so diagonals and curves come from turning both at once. Retracing a line already drawn leaves no new mark; any gap has to be bridged with a real connecting line, just like on the toy.
4. **The archive redraws history.** Since every sketch is fully determined by its number and the batch that was live, the archive doesn't store images. It redraws any past sketch on demand, identical to how it played.

## Files

| File | What it does |
|---|---|
| `index.html` | Landing page: the live sketch, its title placard and status line |
| `archive.html` | Archive: month calendars (Pacific time), a day's sketches, full-size view |
| `site.css` | Shared styles |
| `etch-site.js` | Shared page helpers: time formatting, batch loading, drawing finished sketches, lightbox |
| `etch-core.js` | Drawing helpers (curves, hatching, bricks, grass, …) and the two-knob path planner |
| `etch-engine.js` | The schedule: sketch timing, which batch was live, per-sketch variation, title choice |
| `archive-worker.js` | Redraws archive sketches in a background thread |
| `batches.json` | List of batches and the sketch number each one starts at |
| `batch.js`, `batch-N.js` | The subjects, one file per batch |
| `tools/` | Scripts the daily task uses to review batches and render images |

## Daily batches

A scheduled Claude task runs every afternoon at 4:35 PM Pacific. It reviews the batch that is playing, writes the next day's 48 subjects and its Daily Super Sketch in a new `batch-N.js`, and adds it to `batches.json`. Once Erik approves, the batch is pushed here before it starts at 7:00 AM Pacific (8:00 AM during daylight saving time). The task also prepares a carousel of the day's best sketches for Instagram.

## Important: don't rewrite history

Because sketches are computed rather than stored, changing the wrong file changes what the archive shows for the past. Don't edit:

- `etch-engine.js`
- existing helpers in `etch-core.js` (new helpers can be added at the end)
- any existing batch file
- existing entries, `archiveStart` or `skip` in `batches.json` (new batches are only ever appended)

## Running it locally

The pages load scripts, a JSON file and a web worker, so serve the folder over HTTP rather than opening the files directly:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

The local copy shows the same live sketch as the public site.

## Hosting

The site is served by GitHub Pages from this repository's main branch, with the custom domain `endlessetch.art` (see `CNAME`).

## Credits

Concept and project by Erik Schau. Drawings, subjects, titles and code by Claude (Anthropic). Etch A Sketch is a trademark of its owner; this project is not affiliated with or endorsed by it.
