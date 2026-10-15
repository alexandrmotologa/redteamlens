# Engineering Specification & Implementation Blueprint: RedTeamLens
> Automated OWASP LLM Top 10 Red-Teaming, Adversarial Fuzzer & Security Compliance Scanner for AI Agents

---

## 1. Executive Summary & Problem Space

### 1.1 The Production AI Security Blindspot
As enterprises deploy autonomous agents connected to internal tools, customer data, and execution environments (such as AWS Bedrock, Claude, and OpenAI APIs), security teams face a fundamental verification problem: **how to audit an LLM application before it goes live**.

Unlike traditional web vulnerabilities (SQL injection, XSS), LLM security risks are non-deterministic and semantic:
1. **Unchecked Jailbreak Vulnerabilities:** Attackers use linguistic obfuscation, roleplay framing, base64 encoding, and multi-turn deception to bypass safety prompts.
2. **System Prompt & Intellectual Property Leakage:** Agents can be manipulated into regurgitating secret system instructions, internal API credentials, and confidential business logic.
3. **Excessive Agency & Tool Parameter Poisoning:** When an agent has access to external tools (database queries, email sending, file deletion), attackers inject payloads into the agent's input that trick it into calling sensitive tools with dangerous parameters (e.g. `deleteUser("*")`).
4. **Manual, Costly Penetration Testing:** Human red-teaming takes weeks and costs tens of thousands of dollars, making continuous security verification impossible in fast-moving CI/CD pipelines.

### 1.2 The Solution: RedTeamLens
**RedTeamLens** is an automated offensive security scanner and compliance auditor built in **TypeScript and React 19** for AI agents and LLM applications.

* **Automated 200+ Vector Attack Battery:** Fires structured adversarial probes covering the complete **OWASP Top 10 for Large Language Model Applications**:
  * `LLM01`: Direct & Indirect Prompt Injection (Jailbreaks, Base64/Rot13 obfuscation, developer mode emulation).
  * `LLM02`: Sensitive Information Disclosure (System prompt extraction, environment variable leaks).
  * `LLM06`: Excessive Agency & Tool Abuse (Parameter poisoning, destructive action confirmation bypass).
  * `LLM07`: System Prompt Extraction (Reverse-psychology, translation bypass, token completion).
* **Multi-Target Connector:** Points at any HTTP endpoint, LangGraph agent, AWS Bedrock Agent, or raw model API (Anthropic, OpenAI).
* **Deterministic Vulnerability Scoring Engine:** Evaluates agent responses using dual verification (heuristic regex pattern matching + lightweight LLM-as-a-judge classification) to eliminate false positives.
* **Executive Compliance & Remediation Reports:** Exports audit reports in interactive HTML and Markdown, complete with an OWASP compliance grade (A through F), risk heatmaps, and actionable prompt hardening recipes.
* **Embedded React 19 Security Studio:** Visual dashboard to launch scans, monitor live attack payloads, inspect flagged responses, and verify security fixes.

---

## 2. System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RedTeamLens Architecture                        │
└────────────────────────────────────────────────────────────────────────┘

[ CLI: npx redteamlens scan ]  OR  [ Web Studio ] (http://localhost:50096)
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      RedTeamLens Scanner Core                          │
├────────────────────────────────────────────────────────────────────────┤
│  Attack Vector Corpus & Mutation Engine                                │
│    ├── OWASP LLM Top 10 Benchmark Battery (200+ Test Probes)           │
│    ├── Payload Mutators (Base64, Hex, Leetspeak, Foreign Language)     │
│    └── Multi-Turn Conversational Attack Chains                         │
├────────────────────────────────────────────────────────────────────────┤
│  Target Adapters (Network Dispatcher)                                  │
│    ├── Generic HTTP / REST Agent Endpoint Connector                    │
│    ├── Anthropic Claude Messages API Client                            │
│    ├── AWS Bedrock Agent Runtime Client                                │
│    └── OpenAI Chat Completions Client                                  │
├────────────────────────────────────────────────────────────────────────┤
│  Evaluation & Oracle Engine                                            │
│    ├── Heuristic Pattern Matcher (Regex, Canary Tokens, Leak Matchers) │
│    ├── Behavioral Classification Oracle (LLM-as-a-Judge)               │
│    └── False Positive Suppressor                                       │
├────────────────────────────────────────────────────────────────────────┤
│  Compliance & Report Generator                                         │
│    ├── OWASP LLM Top 10 Compliance Score Calculator (0 - 100%)         │
│    ├── System Prompt Hardening Recipe Generator                        │
│    └── HTML / Markdown / JSON Audit Artifact Exporters                 │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Choices
* **Runtime:** Node.js 22 LTS / TypeScript 5.6+
* **HTTP Engine:** Native Node.js `undici` for high-throughput concurrent fuzzing
* **Evaluation:** Rule-based heuristic matchers + optional lightweight LLM-judge
* **Web Studio:** React 19 + Vite 6 + Tailwind CSS (bundled statically)
* **CLI Engine:** Commander.js + Picocolors + Ora + Table

---

## 3. Directory & File Structure

```
redteamlens/
├── bin/
│   └── redteamlens.js              # CLI executable entry point
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── report.ts           # redteamlens report <scan-result.json> --format html
│   │   │   ├── scan.ts             # redteamlens scan --target <url> --categories LLM01,LLM02
│   │   │   └── studio.ts           # redteamlens studio (Launches visual security dashboard)
│   │   └── index.ts
│   ├── core/
│   │   ├── attacks/
│   │   │   ├── base.ts             # AttackProbe interface
│   │   │   ├── excessive-agency.ts # Tests tool parameter manipulation
│   │   │   ├── indirect-injection.ts# Embedded web context payload tests
│   │   │   ├── prompt-injection.ts # Direct jailbreaks and role confusion
│   │   │   └── system-prompt-leak.ts# Extraction heuristics and reverse psychology
│   │   ├── mutators/
│   │   │   ├── cipher-mutator.ts   # Base64, Hex, and Rot13 encoding
│   │   │   └── language-mutator.ts # Multilingual translation framing
│   │   ├── evaluation/
│   │   │   ├── heuristic-oracle.ts # Fast regex and substring detection
│   │   │   ├── judge-oracle.ts     # Semantic evaluation of compliance violation
│   │   │   └── scoring.ts          # OWASP risk rating and composite score
│   │   └── targets/
│   │       ├── base.ts             # TargetConnector interface
│   │       ├── bedrock-agent.ts    # AWS Bedrock Agent runtime adapter
│   │       ├── generic-http.ts     # Custom REST API endpoint adapter
│   │       └── open-ai-client.ts   # Direct model API adapter
│   ├── reports/
│   │   ├── html-generator.ts       # Self-contained HTML security audit dashboard
│   │   └── markdown-generator.ts   # CI/CD pull-request summary report
│   ├── server/
│   │   ├── api-router.ts           # REST endpoints for embedded Studio
│   │   └── local-server.ts         # Embedded HTTP server
│   └── studio/                     # React 19 Frontend Web Studio
│       ├── index.html
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   ├── AttackPayloadViewer.tsx # Detailed inspector for sent vs received payload
│       │   │   ├── ComplianceGradeCard.tsx # OWASP Letter Grade (A-F) and radar chart
│       │   │   ├── RemediationList.tsx     # Exact prompt hardening fixes
│       │   │   └── VulnerabilityMatrix.tsx # OWASP Top 10 breakdown table
│       │   ├── styles/
│       │   │   └── index.css
│       │   └── main.tsx
│       └── vite.config.ts
├── tests/
│   ├── attacks/
│   │   └── prompt-injection.test.ts
│   └── evaluation/
│       └── heuristic-oracle.test.ts
├── attack-corpus/
│   ├── llm01-jailbreaks.json
│   ├── llm02-sensitive-disclosure.json
│   └── llm06-tool-abuse.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Core Data Contracts & Interfaces

```typescript
// src/core/attacks/base.ts
export type OwaspCategory = 
  | 'LLM01_PROMPT_INJECTION'
  | 'LLM02_SENSITIVE_DISCLOSURE'
  | 'LLM06_EXCESSIVE_AGENCY'
  | 'LLM07_SYSTEM_PROMPT_LEAK';

export interface AttackProbe {
  id: string;
  name: string;
  category: OwaspCategory;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  promptPayload: string;
  expectedRefusalMarkers: string[];
  vulnerabilitySignatures: RegExp[];
  description: string;
  remediationAdvice: string;
}

// src/core/evaluation/scoring.ts
export interface ScanFinding {
  probeId: string;
  probeName: string;
  category: OwaspCategory;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  promptSent: string;
  responseReceived: string;
  isVulnerable: boolean;
  confidenceScore: number;
  matchedSignatures: string[];
  remediation: string;
}

export interface SecurityAuditReport {
  targetUrl: string;
  scannedAt: number;
  totalProbesRun: number;
  vulnerabilitiesFound: number;
  complianceScore: number; // 0 to 100
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  findings: ScanFinding[];
  categoryBreakdown: Record<OwaspCategory, { passed: number; failed: number }>;
}
```

---

## 5. Implementation Roadmap (Phases 1-5)

### Phase 1: Attack Corpus & Target Dispatcher
* Compile structured attack corpus (`attack-corpus/`) containing 200+ verified test probes mapped directly to OWASP LLM categories.
* Implement `GenericHttpTarget` allowing scans against any custom JSON REST API endpoint with configurable headers.
* Implement rate-limiting and concurrent probe worker pool.

### Phase 2: Mutation Engine & Multi-Turn Chains
* Build `cipher-mutator.ts` encoding payloads in Base64, Hex, and Leetspeak to test model decode vulnerabilities.
* Implement multi-turn conversational chains: probe 1 builds rapport/roleplay context, probe 2 executes the jailbreak payload.
* Add canary token injection to detect system prompt leakage with zero false positives.

### Phase 3: Detection Oracles & Risk Scoring
* Implement `heuristic-oracle.ts` evaluating regular expressions and refusal markers (`"I cannot fulfill this request"`).
* Implement dual-check scoring: calculate overall security grade (A: 95-100%, B: 85-94%, C: 70-84%, F: <70%).
* Write unit tests verifying that standard safe responses are never classified as vulnerable.

### Phase 4: Embedded React 19 Studio & Remediation Engine
* Build Compliance Grade Card showing radar chart of OWASP Top 10 vulnerabilities.
* Add interactive Payload Inspector: inspect exact input prompt, model response, and highlighted leak substrings.
* Build Remediation Generator displaying copy-pasteable prompt hardening rules (e.g. system prompt isolation delimiters).

### Phase 5: CI/CD Quality Gates & Documentation
* Support automated CI/CD exit codes (`redteamlens scan --max-critical 0 --fail-on-grade C`).
* Export standalone, single-file HTML audit report containing embedded interactive graphs.
* Write clean, humanized `README.md` with attack breakdown diagrams and automated GitHub Action workflow examples.
