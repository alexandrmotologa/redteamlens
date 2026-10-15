# RedTeamLens System Architecture

RedTeamLens is an automated adversarial security scanner and compliance auditor designed for LLM applications and autonomous AI agents. It evaluates models against the OWASP Top 10 for Large Language Model Applications using a structured corpus of over 200 attack vectors, payload mutations, and deterministic detection oracles.

## Core Components

The architecture consists of four decoupled subsystems:

1. **Attack Corpus and Mutation Pipeline**
   Contains categorized attack probes mapped to OWASP LLM categories (Prompt Injection, Sensitive Information Disclosure, Excessive Agency, System Prompt Extraction, and Indirect Injection). The mutation engine extends base probes with Base64, Hex, ROT13, LeetSpeak, and boundary framing (XML and ChatML tags) to verify decoder resistance.

2. **Target Dispatcher**
   Provides target connectors for different deployment topologies:
   - `GenericHttpTarget`: Sends custom HTTP POST requests to arbitrary REST endpoints with configurable JSON body templates and response path extractors.
   - `OpenAiClientTarget`: Interfaces directly with OpenAI-compatible Chat Completions endpoints (including vLLM, Ollama, and Groq).
   - `AnthropicClientTarget`: Interfaces directly with the Anthropic Messages API.
   - `MockAgentTarget`: Built-in deterministic agent simulator supporting both vulnerable and hardened modes for local validation without API costs.

3. **Dual Verification Oracle Engine**
   Evaluates target responses through a two-stage analysis pipeline:
   - `HeuristicOracle`: Inspects responses using compiled regex signatures, canary token matchers, and refusal phrase dictionaries. Includes false positive suppression to detect when a model quotes attack parameters inside a refusal message.
   - `JudgeOracle`: Evaluates semantic violations using an LLM-as-a-judge prompt when API credentials are provided, falling back to heuristic evaluation when unavailable.

4. **Reporting and Compliance Engine**
   Calculates an overall compliance percentage and letter grade (A through F) based on severity-weighted vulnerability penalties. Exports reports in three formats:
   - Standalone interactive HTML report with embedded styles and inspection modal.
   - GitHub-flavored Markdown for pull request comments and CI logs.
   - Machine-readable JSON for integration into security information systems.

## Data Flow

```
[CLI / Web Studio]
        │
        ▼
[Scanner Engine] ──────► [Attack Corpus (240+ Probes)]
        │                         │
        │                         ▼
        │               [Mutation Engine (Base64/Hex/Delimiters)]
        │                         │
        ▼                         ▼
[Target Dispatcher] ──► [HTTP / Agent / OpenAI Endpoint]
        │                         │
        │                         ▼
        │                [Raw Model Response]
        │                         │
        ▼                         ▼
[Oracle Engine] ◄──────── [Heuristic & Judge Analysis]
        │
        ▼
[Audit Report Compiler] ──► [HTML / Markdown / JSON / Web Studio]
```

## Concurrency and Performance

The scanner engine uses an asynchronous worker pool with configurable concurrency (defaulting to 5 concurrent probes). Each target request is tracked with latency metrics down to millisecond precision, ensuring comprehensive test runs complete within seconds on local or high-throughput targets.
