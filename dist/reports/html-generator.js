export class HtmlReportGenerator {
    static generate(report) {
        const findingsJson = JSON.stringify(report.findings).replace(/</g, '\\u003c');
        const gradeColor = report.letterGrade === 'A'
            ? '#10b981'
            : report.letterGrade === 'B'
                ? '#3b82f6'
                : report.letterGrade === 'C'
                    ? '#f59e0b'
                    : report.letterGrade === 'D'
                        ? '#f97316'
                        : '#ef4444';
        const categoryRows = Object.values(report.categoryBreakdown)
            .map(cat => {
            const passPercent = cat.complianceRate;
            const barColor = passPercent >= 90 ? '#10b981' : passPercent >= 70 ? '#f59e0b' : '#ef4444';
            return `
        <div class="category-card">
          <div class="category-header">
            <span class="category-title">${cat.name}</span>
            <span class="category-rate" style="color: ${barColor}">${passPercent}% Pass</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${passPercent}%; background-color: ${barColor}"></div>
          </div>
          <div class="category-stats">
            <span>Tested: ${cat.total}</span>
            <span class="text-green">Passed: ${cat.passed}</span>
            <span class="${cat.failed > 0 ? 'text-red' : ''}">Failed: ${cat.failed}</span>
            ${cat.criticalCount > 0 ? `<span class="badge-critical">${cat.criticalCount} Critical</span>` : ''}
          </div>
        </div>
      `;
        })
            .join('\n');
        const remediationList = report.recommendedHardening
            .map((rec, i) => `
        <li class="remediation-item">
          <span class="remediation-num">${i + 1}</span>
          <div class="remediation-content">${escapeHtml(rec)}</div>
        </li>
      `)
            .join('\n');
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RedTeamLens Security Audit: ${escapeHtml(report.targetType)}</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1f2937;
      --border-hover: #374151;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #38bdf8;
      --green: #10b981;
      --red: #ef4444;
      --orange: #f97316;
      --yellow: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      padding: 24px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-mark {
      background: linear-gradient(135deg, #ef4444, #8b5cf6);
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
    }
    .brand h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .badge {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: #1e293b;
      color: var(--accent);
      border: 1px solid #334155;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    .stat-label { font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 28px; font-weight: 700; margin-top: 4px; }
    .grade-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 14px;
      font-size: 32px;
      font-weight: 800;
      color: #fff;
    }
    .categories-section { margin-bottom: 32px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 16px;
    }
    .category-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    .category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .category-title { font-weight: 600; font-size: 15px; }
    .category-rate { font-weight: 700; font-size: 15px; }
    .progress-bar-bg { background: #1f2937; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 12px; }
    .progress-bar-fill { height: 100%; border-radius: 4px; }
    .category-stats { display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); align-items: center; }
    .text-green { color: var(--green); }
    .text-red { color: var(--red); font-weight: 600; }
    .badge-critical { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 11px; }

    .remediation-section {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
    }
    .remediation-list { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .remediation-item { display: flex; gap: 12px; align-items: flex-start; }
    .remediation-num {
      background: #3b82f6;
      color: #fff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .remediation-content { font-size: 14px; color: #e2e8f0; }

    .table-controls {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .search-input {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 14px;
      color: var(--text);
      font-size: 14px;
      min-width: 280px;
    }
    .filter-buttons { display: flex; gap: 8px; }
    .btn-filter {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-filter.active { background: #1e293b; color: var(--accent); border-color: var(--accent); font-weight: 600; }

    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow-x: auto;
    }
    table { width: 100%; border-collapse: collapse; font-size: 14px; text-align: left; }
    th {
      background: #0f172a;
      padding: 12px 16px;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
    }
    td { padding: 12px 16px; border-bottom: 1px solid var(--border); }
    tr:hover { background: rgba(255, 255, 255, 0.02); }
    .severity-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .sev-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    .sev-high { background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.4); }
    .sev-medium { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.4); }
    .sev-low { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .status-pass { color: var(--green); font-weight: 600; }
    .status-fail { color: var(--red); font-weight: 600; }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 999;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 14px;
      max-width: 800px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      padding: 24px;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-title { font-size: 18px; font-weight: 700; }
    .modal-close { background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer; }
    .payload-box {
      background: #090d16;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-all;
      margin-top: 6px;
      margin-bottom: 16px;
      color: #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-mark">🛡️</div>
        <div>
          <h1>RedTeamLens Security Audit</h1>
          <p style="font-size: 13px; color: var(--text-muted);">Target: ${escapeHtml(report.targetUrl)} (${escapeHtml(report.targetType)})</p>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge">OWASP LLM Top 10 Compliance</span>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
          ${new Date(report.scannedAt).toISOString()}
        </div>
      </div>
    </header>

    <div class="meta-grid">
      <div class="stat-card" style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div class="stat-label">OWASP Compliance Grade</div>
          <div class="stat-value" style="color: ${gradeColor};">${report.complianceScore}%</div>
        </div>
        <div class="grade-badge" style="background-color: ${gradeColor};">
          ${report.letterGrade}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Vulnerabilities Detected</div>
        <div class="stat-value" style="color: ${report.vulnerabilitiesFound > 0 ? '#ef4444' : '#10b981'};">
          ${report.vulnerabilitiesFound} <span style="font-size: 16px; font-weight: 400; color: var(--text-muted);">/ ${report.totalProbesRun}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Critical / High Severity</div>
        <div class="stat-value" style="color: ${report.severityBreakdown.critical > 0 ? '#ef4444' : '#f59e0b'};">
          ${report.severityBreakdown.critical} <span style="font-size: 14px; color: var(--text-muted);">Crit</span> &nbsp;${report.severityBreakdown.high} <span style="font-size: 14px; color: var(--text-muted);">High</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Scan Execution Time</div>
        <div class="stat-value">
          ${(report.durationMs / 1000).toFixed(2)}s
        </div>
      </div>
    </div>

    <div class="categories-section">
      <div class="section-title">OWASP Category Posture</div>
      <div class="category-grid">
        ${categoryRows}
      </div>
    </div>

    <div class="remediation-section">
      <div class="section-title">Recommended Hardening Recipes</div>
      <ul class="remediation-list">
        ${remediationList}
      </ul>
    </div>

    <div>
      <div class="section-title">Attack Probe Findings Ledger</div>
      <div class="table-controls">
        <input type="text" id="searchInput" class="search-input" placeholder="Search probe, category, payload...">
        <div class="filter-buttons">
          <button class="btn-filter active" onclick="setFilter('all')">All (${report.totalProbesRun})</button>
          <button class="btn-filter" onclick="setFilter('failed')">Failed (${report.vulnerabilitiesFound})</button>
          <button class="btn-filter" onclick="setFilter('passed')">Passed (${report.passedProbes})</button>
          <button class="btn-filter" onclick="setFilter('critical')">Critical (${report.severityBreakdown.critical})</button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Severity</th>
              <th>Probe ID</th>
              <th>Category</th>
              <th>Probe Name</th>
              <th>Latency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="findingsTableBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Inspector Modal -->
  <div id="inspectorModal" class="modal-overlay" onclick="closeModal(event)">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-title" id="modalTitle">Probe Details</div>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div>
        <strong>OWASP Category:</strong> <span id="modalCategory" style="color: var(--accent);"></span>
      </div>
      <div style="margin-top: 8px;">
        <strong>Severity:</strong> <span id="modalSeverity"></span>
        &nbsp;|&nbsp;
        <strong>Status:</strong> <span id="modalStatus"></span>
      </div>
      <div style="margin-top: 16px;">
        <strong>Prompt Payload Sent:</strong>
        <div id="modalPrompt" class="payload-box"></div>
      </div>
      <div>
        <strong>Target Response Received:</strong>
        <div id="modalResponse" class="payload-box"></div>
      </div>
      <div>
        <strong>Remediation Advice:</strong>
        <p id="modalRemediation" style="color: #93c5fd; font-size: 14px; margin-top: 6px;"></p>
      </div>
    </div>
  </div>

  <script>
    const findings = ${findingsJson};
    let currentFilter = 'all';

    function renderTable() {
      const query = document.getElementById('searchInput').value.toLowerCase();
      const tbody = document.getElementById('findingsTableBody');
      tbody.innerHTML = '';

      const filtered = findings.filter(f => {
        if (currentFilter === 'failed' && !f.isVulnerable) return false;
        if (currentFilter === 'passed' && f.isVulnerable) return false;
        if (currentFilter === 'critical' && f.severity !== 'CRITICAL') return false;

        if (query) {
          const match = f.probeId.toLowerCase().includes(query) ||
                        f.probeName.toLowerCase().includes(query) ||
                        f.category.toLowerCase().includes(query) ||
                        f.promptSent.toLowerCase().includes(query);
          if (!match) return false;
        }
        return true;
      });

      for (let i = 0; i < filtered.length; i++) {
        const item = filtered[i];
        const tr = document.createElement('tr');
        const sevClass = 'sev-' + item.severity.toLowerCase();
        tr.innerHTML = \`
          <td>\${item.isVulnerable ? '<span class="status-fail">FAILED</span>' : '<span class="status-pass">PASSED</span>'}</td>
          <td><span class="severity-badge \${sevClass}">\${item.severity}</span></td>
          <td style="font-family: monospace; font-size: 12px;">\${item.probeId}</td>
          <td>\${item.category.replace('LLM', '')}</td>
          <td>\${item.probeName}</td>
          <td style="color: var(--text-muted); font-size: 12px;">\${item.latencyMs}ms</td>
          <td><button class="btn-filter" style="padding: 4px 8px; font-size: 11px;" onclick="inspectFinding(\${findings.indexOf(item)})">Inspect</button></td>
        \`;
        tbody.appendChild(tr);
      }
    }

    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      renderTable();
    }

    document.getElementById('searchInput').addEventListener('input', renderTable);

    function inspectFinding(index) {
      const f = findings[index];
      document.getElementById('modalTitle').textContent = f.probeName + ' (' + f.probeId + ')';
      document.getElementById('modalCategory').textContent = f.category;
      document.getElementById('modalSeverity').textContent = f.severity;
      document.getElementById('modalStatus').innerHTML = f.isVulnerable ? '<span class="status-fail">VULNERABILITY DETECTED</span>' : '<span class="status-pass">DEFENDED / PASSED</span>';
      document.getElementById('modalPrompt').textContent = f.promptSent;
      document.getElementById('modalResponse').textContent = f.responseReceived;
      document.getElementById('modalRemediation').textContent = f.remediation;
      document.getElementById('inspectorModal').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('inspectorModal').style.display = 'none';
    }

    renderTable();
  </script>
</body>
</html>`;
    }
}
function escapeHtml(str) {
    if (!str)
        return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
//# sourceMappingURL=html-generator.js.map