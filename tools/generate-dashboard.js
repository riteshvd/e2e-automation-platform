const fs = require("fs");
const path = require("path");

const reportsDir = path.join(__dirname, "..", "reports");
const outDir = path.join(reportsDir, "dashboard");
const outFile = path.join(outDir, "index.html");

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function countPlaywright(uiResults) {
  if (!uiResults) return null;
  // Playwright json reporter schema can vary; keep robust:
  let passed = 0, failed = 0, skipped = 0;
  const suites = uiResults.suites || [];
  const walk = (s) => {
    (s.specs || []).forEach(spec => {
      (spec.tests || []).forEach(t => {
        const status = t.status;
        if (status === "expected") passed++;
        else if (status === "skipped") skipped++;
        else failed++;
      });
    });
    (s.suites || []).forEach(walk);
  };
  suites.forEach(walk);
  return { passed, failed, skipped, total: passed + failed + skipped };
}

function countNewman(apiResults) {
  if (!apiResults) return null;
  // newman json reporter typically has run.stats
  const stats = apiResults.run?.stats;
  if (!stats) return null;
  return {
    requestsTotal: stats.requests?.total ?? null,
    assertionsTotal: stats.assertions?.total ?? null,
    failedRequests: stats.requests?.failed ?? null,
    failedAssertions: stats.assertions?.failed ?? null,
  };
}

fs.mkdirSync(outDir, { recursive: true });

const uiResults = readJson(path.join(reportsDir, "ui-results.json"));
const apiResults = readJson(path.join(reportsDir, "api-results.json"));
const flaky = readJson(path.join(reportsDir, "flaky-summary.json"));
const meta = readJson(path.join(reportsDir, "run-metadata.json"));

const uiCounts = countPlaywright(uiResults);
const apiCounts = countNewman(apiResults);

const links = [
  { name: "Playwright UI Report", href: "../ui-html/index.html" },
  { name: "Newman API Report", href: "../api-html.html" },
  { name: "Flaky Summary (JSON)", href: "../flaky-summary.json" },
  { name: "UI JUnit (XML)", href: "../ui-junit.xml" },
  { name: "API JUnit (XML)", href: "../api-junit.xml" },
];

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>E2E Automation Platform Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 980px; margin: 24px auto; padding: 0 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card { border: 1px solid #ddd; border-radius: 12px; padding: 14px; }
    h1 { margin: 0 0 10px; }
    h2 { margin: 0 0 10px; font-size: 18px; }
    .muted { color: #666; font-size: 13px; }
    ul { margin: 0; padding-left: 18px; }
    code { background: #f7f7f7; padding: 2px 6px; border-radius: 6px; }
    .bad { color: #b00020; font-weight: 700; }
    .good { color: #1b5e20; font-weight: 700; }
  </style>
</head>
<body>
  <h1>E2E Automation Platform — Dashboard</h1>
  <div class="muted">Last generated: ${new Date().toISOString()}</div>

  <div class="grid" style="margin-top:12px;">
    <div class="card">
      <h2>UI (Playwright)</h2>
      ${uiCounts ? `
        <div>Total: <b>${uiCounts.total}</b> |
          Passed: <span class="good">${uiCounts.passed}</span> |
          Failed: <span class="${uiCounts.failed ? "bad" : "good"}">${uiCounts.failed}</span> |
          Skipped: ${uiCounts.skipped}
        </div>
      ` : `<div class="muted">No UI JSON results found.</div>`}
      <div style="margin-top:10px;">
        <a href="../ui-html/index.html">Open Playwright HTML Report</a>
      </div>
    </div>

    <div class="card">
      <h2>API (Newman)</h2>
      ${apiCounts ? `
        <div>Requests: <b>${apiCounts.requestsTotal}</b> |
          Failed Requests: <span class="${apiCounts.failedRequests ? "bad" : "good"}">${apiCounts.failedRequests}</span>
        </div>
        <div>Assertions: <b>${apiCounts.assertionsTotal}</b> |
          Failed Assertions: <span class="${apiCounts.failedAssertions ? "bad" : "good"}">${apiCounts.failedAssertions}</span>
        </div>
      ` : `<div class="muted">No API JSON results found.</div>`}
      <div style="margin-top:10px;">
        <a href="../api-html.html">Open Newman HTML Report</a>
      </div>
    </div>

    <div class="card">
      <h2>Flaky Signal</h2>
      <div>Detected: <span class="${flaky?.flakyDetected ? "bad" : "good"}">${String(flaky?.flakyDetected ?? false)}</span></div>
      <div class="muted" style="margin-top:6px;">${flaky?.note ?? "No flaky note."}</div>
    </div>

    <div class="card">
      <h2>Run Metadata</h2>
      ${meta ? `
        <div>Branch: <code>${meta.branch}</code></div>
        <div>Commit: <code>${meta.commit}</code></div>
        <div>Build: <code>${meta.buildNumber}</code></div>
        <div>Base URL: <code>${meta.baseUrl}</code></div>
      ` : `<div class="muted">No metadata found.</div>`}
    </div>
  </div>

  <div class="card" style="margin-top:12px;">
    <h2>All Links</h2>
    <ul>
      ${links.map(l => `<li><a href="${l.href}">${l.name}</a></li>`).join("")}
    </ul>
  </div>
</body>
</html>`;

fs.writeFileSync(outFile, html);
console.log("Dashboard generated:", outFile);
