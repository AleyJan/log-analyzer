const fs = require("fs");
const { parseLogFile } = require("./backend/parser");

const content = fs.readFileSync("./sample.log", "utf8");
const { parsed, skipped } = parseLogFile(content);

console.log(`✅ Parsed:  ${parsed.length}`);
console.log(`⚠️  Skipped: ${skipped.length}`);
console.log("\nSample parsed entry:");
console.log(parsed[0]);
console.log("\nSample skipped entry:");
console.log(skipped[0]);
