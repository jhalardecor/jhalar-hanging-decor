// Global teardown: merge per-viewport partial reports (written by parallel
// workers) into the canonical test-results/layout-report.json, in the fixed
// viewport order used by the audit spec.
import fs from 'node:fs';

const order = ['320x568','390x844','430x700','768x1024','911x631','1024x768','1187x743','1366x768','1440x900','1537x863','1920x1080'];

export default function globalTeardown() {
  const dir = 'test-results/report-parts';
  const report = { generatedAt: new Date().toISOString(), viewports: [], failures: [] };
  if (fs.existsSync(dir)) {
    const parts = new Map();
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const part = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf8'));
        parts.set(part.name, part);
      } catch { /* ignore unreadable partial */ }
    }
    for (const name of order) {
      const part = parts.get(name);
      if (!part) continue;
      report.viewports.push(part);
      if (part.problems && part.problems.length) report.failures.push({ viewport: name, problems: part.problems });
    }
  }
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync('test-results/layout-report.json', JSON.stringify(report, null, 2));
}
