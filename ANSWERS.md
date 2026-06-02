## 1. How to run

**Requires Node.js 18+.**

The fastest way to evaluate is the CLI, which has zero dependencies (Node built-ins only):

```bash
# from the project root
node scripts/generate-logs.js     # generates sample.log (a representative messy log)
node cli.js sample.log            # prints a full analysis report
```

To run against your own file:

```bash
node cli.js /path/to/your/file.log
```

The CLI accepts any file path, makes no assumptions about filename, size, or contents, and prints a colored terminal report (overview, status breakdown, slowest endpoints, top endpoints, top IPs, and a full skipped-line summary with line numbers).

**Optional web dashboard** (visual exploration of the same analysis):

```bash
# terminal 1
cd backend && npm install && node index.js      # API on :3001

# terminal 2
cd frontend && npm install && npm run dev        # dashboard on :5173
```

Then open http://localhost:5173 and drag a log file in.

---

## 2. Stack choice

**Node.js (plain JavaScript), no parsing libraries.**

Why this fit the task:

- **Log parsing is string and regex work**, which JavaScript handles natively and which I know well enough to debug quickly under a deadline. The whole parser is built on the standard library — no dependency I'd have to learn or trust.
- **One engine, two interfaces.** The core `parser.js` and `analyzer.js` are pure functions with no I/O. The CLI and the Express backend both import them unchanged, so there's a single source of truth for the analysis logic. Adding the web dashboard cost no duplication.
- **The analyzer functions are pure** (data in, data out, no side effects), which made them easy to test in isolation by piping `parsed`/`skipped` through them in a one-line `node -e` command during development.

What would have been a worse choice:

- **A heavy log-parsing library or a regex-grammar framework.** The whole point of the task is handling input that doesn't fit a fixed grammar. A rigid parser generator would fight the "5–10% deviates" requirement — I'd spend more time bending the library than just writing forgiving JavaScript.
- **Python with pandas.** Tempting for the stats, but pandas wants clean tabular input. Feeding it logs where 10% of rows are malformed, multi-line, or JSON means heavy pre-cleaning anyway — and it adds an install step and a heavier runtime for what is fundamentally line-by-line text triage.
- **A pure shell pipeline (grep/awk).** Fast to start, but it falls apart the moment you need to normalize four timestamp formats and three response-time units into comparable values, and it has no graceful way to _count and report_ what it skipped.

---

## 3. One real edge case

**Timestamps that contain a space (named-month and slash-with-milliseconds formats) combined with appended fields.**

File: `backend/parser.js`, the `NORMAL_REGEX` definition (near the top of the normal-line section).

```js
const NORMAL_REGEX =
  /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}[\.\d]*|\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2}|\S+)\s+([\d.:]+)\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(\S+)\s+(\S+)\s+(\S+)/;
```

The problem: most fields are whitespace-delimited, so the natural instinct is to capture the timestamp as `\S+`. But two of the required timestamp formats contain a space:

- `15-Mar-2024 14:23:01` (named month)
- `2024/03/15 14:00:23.586` (slash format with milliseconds)

With a naive `\S+`, the regex captures only `15-Mar-2024` as the timestamp, then tries to read `14:23:01` as the IP address, the real IP as the method, and the whole line fails to match. It gets silently classified as malformed.

This was the single biggest source of false skips during development — at one point ~1,000 perfectly valid lines were being dropped. The fix is the first alternation group: it explicitly matches the two space-containing timestamp shapes _before_ falling back to `\S+` for the space-free formats (ISO 8601, Unix epoch).

Without this handling, the tool would report a hugely inflated "skipped" count and undercount real traffic — exactly the kind of silent data loss the task warns against. It would look like it worked (no crash, a clean report) while quietly throwing away half the valid log.

---

## 4. AI usage

I used **Claude (Anthropic)** as a pair-programming assistant throughout this project. I want to be straightforward about that, and equally clear about what was mine.

**Where AI was used:**

- **Scaffolding and boilerplate** — initial folder structure, the Express server setup, the Vite/React skeleton, and the first drafts of `parser.js`, `analyzer.js`, and the React components.
- **Regex drafting** — first versions of the timestamp/response-time/normal-line patterns.
- **CSS and component styling** — first drafts of the dashboard styles.

**What was mine — the direction and the judgment:**

- **All design and UX decisions.** The first UI it produced looked generic and AI-made; I rejected it and directed a specific redesign, an industrial terminal aesthetic, monospace type, the amber accent, the hover behavior (which I sent back several times until it felt right), and the choice of windowed-dots pagination over plain page numbers. I gave the design instructions; the AI implemented them.
- **Architecture calls** web dashboard plus a CLI, plain JavaScript over TypeScript, one shared analysis engine for both interfaces.
- **Debugging.** I ran the tool against generated data and fed the real output back. I caught the inflated skip count, the misaligned cards, an unclear column header, and a skipped-lines count that disagreed with the examples shown. The AI helped fix them, but I found them by actually testing.

**Something I changed about the AI output and why:**

The AI's first regex for the normal log line captured the timestamp as a plain `\S+`. When I tested it, ~1,000 valid lines were being skipped. By reading the actual skipped examples I traced it to the space inside the named-month and slash timestamps. We iterated on it across several rounds each time I pasted the real failing lines and the skip-reason breakdown until the count dropped from ~1,000 false skips to the ~216 genuinely-malformed lines. The final regex (the multi-alternation timestamp group in Question 3) came out of that back-and-forth, not the first suggestion. The lesson I took: the AI is good at producing a plausible regex, but only real test output tells you whether it's right.

---

## 5. Honest gap

**The parser loads the entire file into memory at once.**

In `backend/parser.js`, `parseLogFile` takes the full file content and does `content.split("\n")`, holding the whole file, the whole array of lines, and all parsed objects in memory simultaneously.

I tested this on a generated **300,000-line (17 MB)** file and it completed in ~1.7 seconds, so it comfortably handles the assessment's stated maximum ("a few hundred thousand lines"). But it would not scale to genuinely large logs — a multi-gigabyte file would exhaust memory and crash, which is ironic for a tool whose whole selling point is not crashing on bad input.

**With another day**, I'd refactor the read path to stream the file line-by-line using Node's `readline` interface over a read stream, passing each line through the existing per-line parse logic and accumulating only the aggregate stats (counts, running averages, top-N) rather than retaining every parsed object. The parser is already structured around independent per-line decisions, so the parse logic itself wouldn't change — only how lines are fed into it. That would take memory from O(file size) down to roughly O(number of distinct endpoints/IPs), letting it handle arbitrarily large files.

A second, smaller gap: the analyzer computes a simple mean for slowest-endpoint response times. A single outlier can skew that. Given more time I'd add p50/p95/p99 percentiles, which are what you actually want when you're on call and looking at latency.
