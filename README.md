<p align="center">
  <img src="docs/images/logo.png" width="128" height="128" alt="RedTeamLens Logo" />
</p>

<h1 align="center">RedTeamLens</h1>

<p align="center">
  Automated OWASP LLM Top 10 red teaming, adversarial attack fuzzer, and security compliance auditor for AI agents.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OWASP-LLM_Top_10-dc2626.svg" alt="OWASP LLM Top 10" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19.0-61dafb.svg" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-22_LTS-green.svg" alt="Node.js 22 LTS" />
  <img src="https://img.shields.io/badge/License-MIT-purple.svg" alt="License" />
</p>

---

<p align="center">
  <img src="docs/images/redteamlens_demo.gif" alt="RedTeamLens Live Demo" width="100%" />
</p>

## Overview

RedTeamLens audits LLM applications and autonomous agents prior to production deployment. It fires a battery of over 200 structured adversarial probes covering the complete OWASP Top 10 for Large Language Model Applications.

The scanner evaluates agent responses through dual verification: rule-based regex and canary token signatures combined with optional LLM-as-a-judge classification. It flags prompt injections, system prompt leaks, and tool parameter poisoning, then outputs compliance reports in interactive HTML and Markdown.

### Primary Capabilities

* **OWASP LLM Top 10 Attack Battery:** 240 structured probes testing direct jailbreaks, roleplay escapes, canary tokens, environment variable extraction, SQL parameter poisoning, shell injection, and untrusted document payloads.
* **Mutation Pipeline:** Extends test probes with Base64, Hexadecimal, ROT13, LeetSpeak, and boundary injection frames (XML, ChatML, and JSON wrapping).
* **Multi-Target Dispatcher:** Audits any generic HTTP REST agent endpoint, OpenAI Chat Completions API, Anthropic Messages API, or the built-in deterministic simulator.
* **Dual Verification Oracle:** Uses compiled regular expressions, refusal markers, and false positive suppressors to ensure echo quotes do not register as vulnerabilities.
* **Interactive React 19 Studio:** Web dashboard for configuring targets, tracking live probe execution, inspecting payload diffs, and viewing compliance letter grades (A through F).
* **Automated Remediation Engine:** Generates specific system prompt hardening clauses and tool validation policies based on detected failures.
* **CI/CD Quality Gates:** Supports configurable failure thresholds (`--fail-on-grade B`, `--max-critical 0`) for pull request checks and build pipelines.

---

## Visual Studio & Audit Interface

### Live Security Studio Dashboard
The embedded visual dashboard provides real-time telemetry, OWASP category compliance percentages, and live probe logs.

<p align="center">
  <img src="docs/images/redteamlens-dashboard.png" alt="RedTeamLens Studio Dashboard" width="100%" />
</p>

### Attack Payload Inspector
Inspect exact prompt payloads dispatched to the model alongside the raw response received, matched signatures, and prompt hardening advice.

<p align="center">
  <img src="docs/images/redteamlens-inspector.png" alt="RedTeamLens Attack Payload Inspector" width="100%" />
</p>

### Standalone HTML Compliance Report
Export single-file self-contained HTML audit reports containing embedded graphs and search filters, ready for distribution to security teams.

<p align="center">
  <img src="docs/images/redteamlens-report.png" alt="RedTeamLens HTML Security Report" width="100%" />
</p>

---

## Installation

### Global or NPX Execution

```bash
# Run scan immediately via npx
npx redteamlens scan --demo

# Launch the visual Web Studio
npx redteamlens studio
```

### Local Repository Setup

```bash
git clone https://github.com/alexandrmotologa/redteamlens.git
cd redteamlens
npm install
npm run build
```

---

## CLI Usage

### Running a Scan

Run a scan against the built-in demo agent simulator:

```bash
# Scan vulnerable demo simulator
npx redteamlens scan --demo

# Scan hardened demo simulator
npx redteamlens scan --demo --hardened
```

Scan a custom HTTP REST endpoint:

```bash
npx redteamlens scan \
  --target "http://localhost:4000/api/chat" \
  --concurrency 5 \
  --output "audit-report.html"
```

Scan an OpenAI or OpenAI-compatible model:

```bash
npx redteamlens scan \
  --openai \
  --api-key "$OPENAI_API_KEY" \
  --model "gpt-4o-mini" \
  --categories "LLM01,LLM02,LLM06" \
  --output "openai-audit.md"
```

### Filtering by Category and Severity

```bash
# Run only prompt injection and sensitive disclosure probes
npx redteamlens scan --demo --categories "LLM01,LLM02"

# Run only critical severity probes
npx redteamlens scan --demo --severities "CRITICAL"
```

### Launching the Web Studio

```bash
npx redteamlens studio --port 50096
```

### CI/CD Quality Gates & SARIF Export

Enforce security policies in automated pipelines with exit codes and GitHub Security tab integration:

```bash
# Fail build if compliance grade is below B
npx redteamlens scan --target "https://staging.internal/chat" --fail-on-grade "B"

# Fail build if any critical vulnerabilities are detected and output SARIF
npx redteamlens scan \
  --target "https://staging.internal/chat" \
  --max-critical 0 \
  --format sarif \
  --output "results.sarif" \
  --badge "docs/security-badge.svg"
```

### Multi-Turn Conversational Attack Chains (Crescendo)

Execute stateful, progressive dialogue scenarios that establish trust and lead up to restricted token extraction:

```bash
npx redteamlens scan --demo --multi-turn
```

### Automated System Prompt Hardener

Synthesize defensive XML boundaries, confidentiality non-disclosure rules, and canary token filters into existing system prompts:

```bash
npx redteamlens patch -i system-prompt.txt -o hardened-prompt.txt
```

### Audit Comparator & Regression Tracking

Compare baseline and comparison audit JSON runs to identify resolved vulnerabilities and flag newly introduced regressions:

```bash
npx redteamlens compare baseline.json candidate.json -o comparison.md
```

### SVG Status Badge Generation

Generate an SVG shield badge displaying current OWASP compliance grade and score:

```bash
npx redteamlens badge --score 96 --grade A --output badge.svg
```

---

## Attack Corpus Mapping

RedTeamLens organizes its 240 active probes around the OWASP Top 10 for Large Language Model Applications:

| Category | Description | Probes | Key Attack Vectors |
| :--- | :--- | :---: | :--- |
| `LLM01` | Prompt Injection | 70 | Direct resets, persona override (DAN), boundary escapes, ROT13/Base64 framing |
| `LLM02` | Sensitive Information Disclosure | 55 | API key extraction, canary tokens, environment variable dumps, file paths |
| `LLM06` | Excessive Agency & Tool Abuse | 50 | SQL parameter poisoning, shell injection, confirmation bypass codes |
| `LLM07` | System Prompt Leakage | 45 | Verbatim instruction requests, translation bypass, token continuation |
| `LLM08` | Indirect Prompt Injection | 20 | Injected instructions in retrieved documents, fake system headers, web content |

---

## Programmatic Library Usage

RedTeamLens can also be integrated directly into Node.js and TypeScript test suites:

```typescript
import {
  ScannerEngine,
  MockAgentTarget,
  GenericHttpTarget,
  HtmlReportGenerator
} from 'redteamlens';

const target = new GenericHttpTarget({
  url: 'http://localhost:4000/chat',
  method: 'POST',
  responsePath: 'response'
});

const scanner = new ScannerEngine({ target, concurrency: 5 });

const report = await scanner.runScan({
  target,
  categories: ['LLM01_PROMPT_INJECTION', 'LLM02_SENSITIVE_DISCLOSURE'],
  limit: 50
});

console.log(`Compliance Score: ${report.complianceScore}% (Grade: ${report.letterGrade})`);
console.log(`Vulnerabilities Found: ${report.vulnerabilitiesFound}`);

const html = HtmlReportGenerator.generate(report);
```

---

## Architecture

For in-depth technical documentation on target dispatching, mutation logic, and scoring math, refer to [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

For the complete threat matrix and remediation strategies, refer to [docs/OWASP_MAPPING.md](docs/OWASP_MAPPING.md).

For automated GitHub Actions workflows, refer to [docs/CI_CD_INTEGRATION.md](docs/CI_CD_INTEGRATION.md).

---

## License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.
