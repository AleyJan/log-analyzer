#!/usr/bin/env node
// cli.js
// Command-line entry point for the log analyzer.
// Usage: node cli.js <path-to-log-file>
// Reuses the same parser and analyzer as the web backend.

const fs = require("fs");
const path = require("path");
const { parseLogFile } = require("./backend/parser");
const { analyze } = require("./backend/analyzer");

// --- ANSI colors (no dependency) ---
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  amber: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function header(text) {
  console.log("\n" + c.amber + c.bold + "── " + text + " ──" + c.reset);
}

function row(label, value, color = c.reset) {
  console.log(
    `  ${c.gray}${label.padEnd(22)}${c.reset}${color}${value}${c.reset}`,
  );
}

function main() {
  const filePath = process.argv[2];

  // No argument provided
  if (!filePath) {
    console.error(`${c.red}Error:${c.reset} no log file provided.`);
    console.error(`\nUsage: ${c.cyan}node cli.js <path-to-log-file>${c.reset}`);
    console.error(`Example: ${c.cyan}node cli.js sample.log${c.reset}\n`);
    process.exit(1);
  }

  // File does not exist
  if (!fs.existsSync(filePath)) {
    console.error(`${c.red}Error:${c.reset} file not found: ${filePath}\n`);
    process.exit(1);
  }

  // Read + analyze
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`${c.red}Error reading file:${c.reset} ${err.message}\n`);
    process.exit(1);
  }

  const start = Date.now();
  const { parsed, skipped } = parseLogFile(content);
  const result = analyze(parsed, skipped);
  const elapsed = Date.now() - start;

  const o = result.overview;

  // ─── Print Report ───
  console.log(
    "\n" +
      c.bold +
      c.amber +
      "  LOG ANALYZER" +
      c.reset +
      c.gray +
      "  ·  " +
      path.basename(filePath) +
      c.reset,
  );
  console.log(c.gray + "  " + "─".repeat(50) + c.reset);

  header("OVERVIEW");
  row("Total requests", o.totalRequests.toLocaleString(), c.cyan);
  row("Total errors", o.totalErrors.toLocaleString(), c.red);
  row("Error rate", o.errorRate + "%", o.errorRate > 10 ? c.red : c.green);
  row("Skipped lines", o.skippedLines.toLocaleString(), c.amber);
  row("Duration", o.durationMinutes ? o.durationMinutes + " min" : "—", c.blue);
  row("Parse time", elapsed + " ms", c.gray);

  header("STATUS CODES");
  const g = result.statusBreakdown.groups;
  row("2xx success", g["2xx"], c.green);
  row("3xx redirect", g["3xx"], c.blue);
  row("4xx client err", g["4xx"], c.amber);
  row("5xx server err", g["5xx"], c.red);
  if (g.unknown) row("unknown", g.unknown, c.gray);

  header("TOP 10 SLOWEST ENDPOINTS");
  result.slowestEndpoints.slice(0, 10).forEach((e, i) => {
    const color = e.avgMs > 2000 ? c.red : e.avgMs > 1000 ? c.amber : c.green;
    console.log(
      `  ${c.gray}${String(i + 1).padStart(2)}.${c.reset} ${color}${String(e.avgMs + "ms").padEnd(8)}${c.reset} ${c.dim}avg${c.reset}  ${e.endpoint} ${c.gray}(${e.count} hits)${c.reset}`,
    );
  });

  header("TOP 10 ENDPOINTS BY TRAFFIC");
  result.topEndpoints.slice(0, 10).forEach((e, i) => {
    const errTxt =
      e.errors > 0
        ? `${c.red}${e.errors} err${c.reset}`
        : `${c.green}0 err${c.reset}`;
    console.log(
      `  ${c.gray}${String(i + 1).padStart(2)}.${c.reset} ${String(e.count).padStart(5)} ${c.dim}hits${c.reset}  ${e.endpoint.padEnd(28)} ${errTxt}`,
    );
  });

  header("TOP 10 IPS");
  result.topIPs.slice(0, 10).forEach((ip, i) => {
    const color =
      ip.errorRate > 20 ? c.red : ip.errorRate > 5 ? c.amber : c.green;
    console.log(
      `  ${c.gray}${String(i + 1).padStart(2)}.${c.reset} ${ip.ip.padEnd(16)} ${String(ip.count).padStart(5)} ${c.dim}req${c.reset}  ${color}${ip.errorRate}% err${c.reset}`,
    );
  });

  header("SKIPPED LINES");
  const reasons = result.skippedSummary.reasons;
  if (Object.keys(reasons).length === 0) {
    console.log(`  ${c.green}None — every line parsed cleanly.${c.reset}`);
  } else {
    Object.entries(reasons).forEach(([reason, count]) => {
      row(reason, count, c.amber);
    });
    // Show first 3 examples (non-blank)
    const examples = result.skippedSummary.examples
      .filter((e) => e.reason !== "blank line")
      .slice(0, 3);
    if (examples.length > 0) {
      console.log(`\n  ${c.dim}Examples:${c.reset}`);
      examples.forEach((ex) => {
        console.log(
          `  ${c.gray}L${ex.lineNumber}:${c.reset} ${c.dim}${ex.raw.slice(0, 60)}${c.reset}`,
        );
      });
    }
  }

  console.log("\n" + c.gray + "  " + "─".repeat(50) + c.reset);
  console.log(
    `  ${c.green}✓${c.reset} Analyzed ${c.bold}${(parsed.length + skipped.length).toLocaleString()}${c.reset} lines in ${elapsed}ms\n`,
  );
}

main();
