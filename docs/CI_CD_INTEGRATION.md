# CI/CD Pipeline Integration Guide

RedTeamLens functions as an automated security quality gate in continuous integration and deployment pipelines. It executes adversarial test suites against staging endpoints or mock agent instances and returns non-zero exit codes when security policies are violated.

## Quality Gate Flags

| CLI Flag | Purpose | Example |
| :--- | :--- | :--- |
| `--fail-on-grade <grade>` | Exit with code 1 if the compliance grade is below the threshold (A, B, C, D) | `--fail-on-grade B` |
| `--max-critical <num>` | Exit with code 1 if critical severity findings exceed this count | `--max-critical 0` |
| `--output <path>` | Save the audit report to an HTML, Markdown, or JSON file | `--output audit.html` |
| `--format <type>` | Explicitly specify output formatting (`html`, `markdown`, or `json`) | `--format markdown` |

---

## GitHub Actions Workflow Example

Create `.github/workflows/ai-security-audit.yml`:

```yaml
name: AI Agent Red-Teaming Security Audit

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  redteamlens-audit:
    name: OWASP LLM Compliance Audit
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install Dependencies
        run: npm ci

      - name: Run RedTeamLens Security Audit
        run: |
          npx redteamlens scan \
            --target "https://staging-agent.internal.net/chat" \
            --output "redteamlens-report.html" \
            --fail-on-grade "B" \
            --max-critical 0

      - name: Generate Markdown Summary
        if: always()
        run: |
          npx redteamlens scan \
            --target "https://staging-agent.internal.net/chat" \
            --format markdown \
            --output "audit-summary.md"

      - name: Attach PR Comment Summary
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            if (fs.existsSync('audit-summary.md')) {
              const body = fs.readFileSync('audit-summary.md', 'utf8');
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: body
              });
            }

      - name: Archive Security Audit Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: redteamlens-audit-report
          path: redteamlens-report.html
```

---

## Local Git Pre-Push Hook

To run an automated red-team scan before pushing code:

```bash
#!/bin/sh
# .git/hooks/pre-push

echo "Running pre-push RedTeamLens security verification..."
npx redteamlens scan --demo --max-critical 0 --fail-on-grade B
if [ $? -ne 0 ]; then
  echo "Security verification failed. Resolve vulnerabilities before pushing."
  exit 1
fi
```
