// Global setup: clear per-viewport report partials before each audit run so a
// partial re-run never merges stale results from an earlier run.
import fs from 'node:fs';

export default function globalSetup() {
  fs.rmSync('test-results/report-parts', { recursive: true, force: true });
}
