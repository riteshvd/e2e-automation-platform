const fs = require("fs");
const path = require("path");

const reportsDir = path.join(__dirname, "..", "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const meta = {
  timestamp: new Date().toISOString(),
  baseUrl: process.env.BASE_URL || "http://localhost:3001",
  branch: process.env.BRANCH_NAME || process.env.GIT_BRANCH || "unknown",
  commit: process.env.GIT_COMMIT || "unknown",
  buildNumber: process.env.BUILD_NUMBER || "local",
};

fs.writeFileSync(path.join(reportsDir, "run-metadata.json"), JSON.stringify(meta, null, 2));
console.log("Wrote reports/run-metadata.json");
