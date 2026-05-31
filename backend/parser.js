// parser.js
// Parses a raw log file into structured entries.
// Never throws — bad lines are collected separately.

// --- Timestamp Normalizers ---

function parseTimestamp(raw) {
  if (!raw) return null;

  // Unix epoch (pure number)
  if (/^\d{10}$/.test(raw)) {
    return new Date(parseInt(raw) * 1000);
  }

  // ISO 8601: 2024-03-15T14:23:01Z
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(raw)) {
    const d = new Date(raw);
    return isNaN(d) ? null : d;
  }

  // Slash format with or without milliseconds:
  // 2024/03/15 14:23:01 OR 2024/03/15 14:00:16.944
  if (/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/.test(raw)) {
    // strip milliseconds if present, then normalize
    const stripped = raw.replace(/(\d{2}:\d{2}:\d{2})\.\d+/, "$1");
    const normalized = stripped.replace(/\//g, "-").replace(" ", "T") + "Z";
    const d = new Date(normalized);
    return isNaN(d) ? null : d;
  }

  // Named month: 15-Mar-2024 14:23:01
  // new Date() handles this natively
  if (/^\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2}/.test(raw)) {
    // reformat to: Mar 15 2024 14:23:01 UTC
    const parts = raw.match(
      /^(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}:\d{2}:\d{2})$/,
    );
    if (!parts) return null;
    const [, day, mon, year, time] = parts;
    const d = new Date(`${mon} ${day} ${year} ${time} UTC`);
    return isNaN(d) ? null : d;
  }

  return null;
}

// --- Response Time Normalizer (always returns ms as number) ---

function parseResponseTime(raw) {
  if (!raw) return null;

  // milliseconds: 142ms
  if (/^\d+(\.\d+)?ms$/.test(raw)) {
    return parseFloat(raw);
  }

  // seconds: 0.142s
  if (/^\d+(\.\d+)?s$/.test(raw)) {
    return parseFloat(raw) * 1000;
  }

  // bare number (assume ms)
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return parseFloat(raw);
  }

  return null;
}

// --- Status Code Normalizer ---

function parseStatus(raw) {
  if (!raw || raw === "-") return null;
  const n = parseInt(raw);
  if (isNaN(n)) return null;
  if (n < 100 || n > 599) return null;
  return n;
}

// --- Normal Line Parser ---
// Format: TIMESTAMP IP METHOD PATH STATUS RESPONSETIME [extra...]
// Example: 2024-03-15T14:23:01Z 192.168.1.42 GET /api/users 200 142ms

const NORMAL_REGEX =
  /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}[\.\d]*|\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2}|\S+)\s+([\d.:]+)\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(\S+)\s+(\S+)\s+(\S+)/;

function parseNormalLine(line) {
  const match = line.match(NORMAL_REGEX);
  if (!match) return null;

  const [, tsRaw, ip, method, path, statusRaw, rtRaw] = match;

  const timestamp = parseTimestamp(tsRaw);
  const status = parseStatus(statusRaw);
  const responseTime = parseResponseTime(rtRaw);

  if (!method || !path) return null;

  return {
    type: "normal",
    timestamp,
    ip,
    method,
    path,
    status,
    responseTime,
  };
}

// --- JSON Line Parser ---

function parseJsonLine(line) {
  try {
    const obj = JSON.parse(line);

    // Must look like a log entry
    if (!obj.method && !obj.path && !obj.status) return null;

    return {
      type: "json",
      timestamp: obj.timestamp ? parseTimestamp(String(obj.timestamp)) : null,
      ip: obj.ip || null,
      method: obj.method || null,
      path: obj.path || null,
      status: obj.status ? parseStatus(String(obj.status)) : null,
      responseTime: obj.responseTime
        ? parseResponseTime(String(obj.responseTime))
        : null,
    };
  } catch {
    return null;
  }
}

// --- Main Parse Function ---

function parseLogFile(content) {
  const lines = content.split("\n");

  const parsed = [];
  const skipped = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    const lineNumber = i + 1;

    // Blank line
    if (!line) {
      skipped.push({ lineNumber, raw, reason: "blank line" });
      continue;
    }

    // Try JSON first
    if (line.startsWith("{")) {
      const entry = parseJsonLine(line);
      if (entry) {
        parsed.push(entry);
        continue;
      } else {
        skipped.push({ lineNumber, raw, reason: "invalid JSON structure" });
        continue;
      }
    }

    // Try normal format
    const entry = parseNormalLine(line);
    if (entry) {
      parsed.push(entry);
      continue;
    }

    // Nothing matched — malformed
    skipped.push({ lineNumber, raw, reason: "unrecognized format" });
  }

  return { parsed, skipped };
}

module.exports = { parseLogFile };
