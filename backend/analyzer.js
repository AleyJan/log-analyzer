// analyzer.js
// Takes the parsed entries from parser.js and produces useful statistics.
// All functions are pure — they take data in, return results out, no side effects.

// --- Helper: group an array by a key function ---
function groupBy(arr, keyFn) {
  const map = {};
  for (const item of arr) {
    const key = keyFn(item);
    if (!map[key]) map[key] = [];
    map[key].push(item);
  }
  return map;
}

// --- 1. Overview Stats ---
// Total requests, total errors, error rate, time range
function getOverview(entries, skipped) {
  const total = entries.length;
  const errors = entries.filter((e) => e.status && e.status >= 400).length;
  const errorRate = total > 0 ? ((errors / total) * 100).toFixed(2) : 0;

  const timestamps = entries
    .map((e) => e.timestamp)
    .filter(Boolean)
    .sort((a, b) => a - b);

  const firstSeen = timestamps[0] || null;
  const lastSeen = timestamps[timestamps.length - 1] || null;

  // duration in minutes
  let duration = null;
  if (firstSeen && lastSeen) {
    duration = ((lastSeen - firstSeen) / 1000 / 60).toFixed(1);
  }

  return {
    totalRequests: total,
    totalErrors: errors,
    errorRate: parseFloat(errorRate),
    skippedLines: skipped.length,
    firstSeen,
    lastSeen,
    durationMinutes: duration ? parseFloat(duration) : null,
  };
}

// --- 2. Status Code Breakdown ---
// Count of each status code, grouped into 2xx, 3xx, 4xx, 5xx
function getStatusBreakdown(entries) {
  const counts = {};
  const groups = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, unknown: 0 };

  for (const entry of entries) {
    const s = entry.status;
    if (!s) {
      groups["unknown"]++;
      continue;
    }
    counts[s] = (counts[s] || 0) + 1;

    if (s >= 200 && s < 300) groups["2xx"]++;
    else if (s >= 300 && s < 400) groups["3xx"]++;
    else if (s >= 400 && s < 500) groups["4xx"]++;
    else if (s >= 500 && s < 600) groups["5xx"]++;
    else groups["unknown"]++;
  }

  // Convert counts object to sorted array
  const breakdown = Object.entries(counts)
    .map(([code, count]) => ({ code: parseInt(code), count }))
    .sort((a, b) => b.count - a.count);

  return { groups, breakdown };
}

// --- 3. Top 10 Slowest Endpoints ---
// Average response time per path, sorted descending
function getSlowestEndpoints(entries) {
  const withTime = entries.filter((e) => e.responseTime !== null && e.path);

  const grouped = groupBy(withTime, (e) => `${e.method} ${e.path}`);

  const endpoints = Object.entries(grouped).map(([endpoint, reqs]) => {
    const times = reqs.map((r) => r.responseTime);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    return {
      endpoint,
      avgMs: Math.round(avg),
      maxMs: max,
      minMs: min,
      count: reqs.length,
    };
  });

  return endpoints.sort((a, b) => b.avgMs - a.avgMs);
}

// --- 4. Top 10 IPs by Request Count ---
function getTopIPs(entries) {
  const grouped = groupBy(
    entries.filter((e) => e.ip),
    (e) => e.ip,
  );

  return Object.entries(grouped)
    .map(([ip, reqs]) => {
      const errors = reqs.filter((r) => r.status && r.status >= 400).length;
      return {
        ip,
        count: reqs.length,
        errors,
        errorRate:
          reqs.length > 0
            ? parseFloat(((errors / reqs.length) * 100).toFixed(1))
            : 0,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// --- 5. Top 10 Most Requested Endpoints ---
function getTopEndpoints(entries) {
  const grouped = groupBy(
    entries.filter((e) => e.path),
    (e) => `${e.method} ${e.path}`,
  );

  return Object.entries(grouped)
    .map(([endpoint, reqs]) => {
      const errors = reqs.filter((r) => r.status && r.status >= 400).length;
      return {
        endpoint,
        count: reqs.length,
        errors,
        errorRate: parseFloat(((errors / reqs.length) * 100).toFixed(1)),
      };
    })
    .sort((a, b) => b.count - a.count);
}

// --- 6. HTTP Method Breakdown ---
function getMethodBreakdown(entries) {
  const grouped = groupBy(
    entries.filter((e) => e.method),
    (e) => e.method,
  );

  return Object.entries(grouped)
    .map(([method, reqs]) => ({ method, count: reqs.length }))
    .sort((a, b) => b.count - a.count);
}

// --- 7. Requests Over Time (per minute buckets) ---
function getRequestsOverTime(entries) {
  const withTime = entries.filter((e) => e.timestamp);

  const buckets = {};
  for (const entry of withTime) {
    // Round down to the nearest minute
    const d = new Date(entry.timestamp);
    d.setSeconds(0, 0);
    const key = d.toISOString();
    buckets[key] = (buckets[key] || 0) + 1;
  }

  return Object.entries(buckets)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => new Date(a.time) - new Date(b.time));
}

// --- 8. Skipped Lines Summary ---
function getSkippedSummary(skipped) {
  const reasons = {};
  for (const s of skipped) {
    reasons[s.reason] = (reasons[s.reason] || 0) + 1;
  }

  // Send ALL skipped lines, blank or not
  const examples = skipped.map((s) => ({
    lineNumber: s.lineNumber,
    raw: s.raw ? s.raw.slice(0, 120) : "(blank line)",
    reason: s.reason,
  }));

  return { reasons, examples };
}

// --- Main Analyze Function ---
function analyze(parsed, skipped) {
  return {
    overview: getOverview(parsed, skipped),
    statusBreakdown: getStatusBreakdown(parsed),
    slowestEndpoints: getSlowestEndpoints(parsed),
    topIPs: getTopIPs(parsed),
    topEndpoints: getTopEndpoints(parsed),
    methodBreakdown: getMethodBreakdown(parsed),
    requestsOverTime: getRequestsOverTime(parsed),
    skippedSummary: getSkippedSummary(skipped),
  };
}

module.exports = { analyze };
