const fs = require("fs");
const path = require("path");

const junitPath = path.join(__dirname, "..", "reports", "ui-junit.xml");
const outPath = path.join(__dirname, "..", "reports", "flaky-summary.json");

if (!fs.existsSync(junitPath)) {
  console.log("No UI JUnit report found:", junitPath);
  process.exit(0);
}

const xml = fs.readFileSync(junitPath, "utf8");

// Very lightweight parse: flag anything with "flaky" patterns.
// (We’ll improve this later into proper XML parsing.)
const flakyHints = [
  "flaky", "retry", "retries", "on-first-retry", "Retry #"
];

const isPossiblyFlaky = flakyHints.some(h => xml.toLowerCase().includes(h));

const summary = {
  timestamp: new Date().toISOString(),
  uiJunit: "reports/ui-junit.xml",
  flaggedPossiblyFlaky: isPossiblyFlaky,
  note: "Phase 5 starter: heuristic detection. Next phase will parse retries precisely."
};

fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log("Wrote:", outPath);
