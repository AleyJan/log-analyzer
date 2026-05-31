const fs = require("fs");
const path = require("path");

// --- Config ---
const TOTAL_LINES = 2000;
const OUTPUT_FILE = path.join(__dirname, "../sample.log");

// --- Data Pools ---
const IPS = [
  "192.168.1.42",
  "10.0.0.7",
  "172.16.0.5",
  "203.0.113.12",
  "198.51.100.3",
  "10.10.10.1",
  "192.168.0.100",
  "8.8.8.8",
];

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

const PATHS = [
  "/api/users",
  "/api/users/12",
  "/api/login",
  "/api/logout",
  "/api/products",
  "/api/products/55",
  "/api/orders",
  "/api/orders/99",
  "/api/payments",
  "/health",
  "/api/auth/refresh",
  "/api/search",
];

const STATUS_CODES = [
  200,
  200,
  200,
  200,
  201,
  204, // mostly success
  400,
  401,
  403,
  404,
  404, // client errors
  500,
  502,
  503, // server errors
];

const USER_AGENTS = [
  '"Mozilla/5.0 (Windows NT 10.0)"',
  '"curl/7.68.0"',
  '"PostmanRuntime/7.29.0"',
  '"python-requests/2.28.0"',
];

// --- Helpers ---
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomResponseTime() {
  const ms = randomInt(5, 4000);
  const format = randomInt(1, 3);
  if (format === 1) return `${ms}ms`;
  if (format === 2) return `${(ms / 1000).toFixed(3)}s`;
  return `${ms}`; // bare number
}

function randomTimestamp(base) {
  const format = randomInt(1, 4);
  const d = new Date(base);
  if (format === 1) return d.toISOString().replace(".000Z", "Z"); // 2024-03-15T14:23:01Z
  if (format === 2) {
    const iso = d.toISOString().replace(".000Z", "Z");
    return iso.replace(/-/g, "/").replace("T", " ").replace("Z", "");
  }
  if (format === 3) {
    // 15-Mar-2024 14:23:01
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${String(d.getUTCDate()).padStart(2, "0")}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")}`;
  }
  return `${Math.floor(d.getTime() / 1000)}`; // Unix epoch
}

function randomStatus() {
  // ~5% chance of missing status
  if (Math.random() < 0.05) return "-";
  return randomFrom(STATUS_CODES);
}

// --- Line Generators ---
function normalLine(timestamp) {
  const ip = randomFrom(IPS);
  const method = randomFrom(METHODS);
  const urlPath = randomFrom(PATHS);
  const status = randomStatus();
  const responseTime = randomResponseTime();
  // ~15% chance of extra fields
  const extra = Math.random() < 0.15 ? ` ${randomFrom(USER_AGENTS)}` : "";
  return `${timestamp} ${ip} ${method} ${urlPath} ${status} ${responseTime}${extra}`;
}

function jsonLine(timestamp) {
  return JSON.stringify({
    timestamp,
    ip: randomFrom(IPS),
    method: randomFrom(METHODS),
    path: randomFrom(PATHS),
    status: randomFrom(STATUS_CODES),
    responseTime: randomInt(5, 4000),
  });
}

function malformedLine() {
  const types = [
    "", // blank line
    "MALFORMED no structure here at all", // garbage
    "2024-03-15T14:23:01Z incomplete", // partial write
    "NullPointerException at line 42\n  at com.example.App.main(App.java:42)", // stack trace
    '::1 - - [15/Mar/2024:14:23:01 +0000] "GET / HTTP/1.1" 200 1234', // apache format
  ];
  return randomFrom(types);
}

// --- Main Generator ---
function generate() {
  const lines = [];
  let base = new Date("2024-03-15T14:00:00Z").getTime();

  for (let i = 0; i < TOTAL_LINES; i++) {
    base += randomInt(100, 3000); // advance time
    const timestamp = randomTimestamp(base);
    const roll = Math.random();

    if (roll < 0.8) {
      // 80% normal lines
      lines.push(normalLine(timestamp));
    } else if (roll < 0.9) {
      // 10% JSON lines
      lines.push(jsonLine(timestamp));
    } else {
      // 10% malformed
      lines.push(malformedLine());
    }
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join("\n"), "utf8");
  console.log(`✅ Generated ${TOTAL_LINES} lines → ${OUTPUT_FILE}`);
  console.log(`   Normal lines:    ~${Math.round(TOTAL_LINES * 0.8)}`);
  console.log(`   JSON lines:      ~${Math.round(TOTAL_LINES * 0.1)}`);
  console.log(`   Malformed lines: ~${Math.round(TOTAL_LINES * 0.1)}`);
}

generate();
