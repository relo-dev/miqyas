# Miqyas AI
### Automated Static Code Analysis & DGA Compliance Evaluator for Saudi Government Applications

**Miqyas AI** is an LLM-powered static code analysis system designed to evaluate software repositories before deployment in Saudi government environments. It combines AI-assisted source-code analysis with deterministic scoring and localized DGA/NDMO compliance rules to provide a structured assessment of software readiness.

---

## Overview

Miqyas evaluates submitted source-code repositories across four weighted dimensions:

| Evaluation Pillar | Weight |
| :--- | :--- |
| **Cybersecurity** | 30% |
| **Software Performance** | 25% |
| **Clean Code & Architecture** | 25% |
| **DGA / NDMO Compliance** | 20% |

The system identifies potential issues, calculates pillar scores, applies mandatory security and compliance override rules, and returns structured evaluation results with actionable recommendations.

---

## Key Features

* **AI-Powered Code Analysis:** Static source-code auditing powered by domain-specific prompting.
* **Saudi-Specific Compliance:** Built-in checks for DGA (Digital Government Authority) and NDMO controls.
* **Deterministic Weighted Scoring:** Combined scoring formula reflecting industry and government priorities.
* **Mandatory Override Safeguards:** Prevents critical security or compliance vulnerabilities from being masked by a high overall score.
* **Structured Output:** Delivers findings, scores, and remediations in consistent JSON formats.
* **Resource Management:** Secure in-memory extraction, 20 MB upload limit, and an 80,000-character budget per audit.
* **Interactive Dashboard:** Modern web UI for repository submission and visualization of results.

---

## Architecture

![Miqyas AI Architecture](docs/images/architecture.png)

The evaluation pipeline enforces deterministic behavior via strict model constraints:
* **Sampling Settings:** `temperature=0.0`
* **Output Enforcement:** `response_format={"type": "json_object"}`

### Scoring Formulation
$$\text{Overall Score} = (0.30 \times \text{Cybersecurity}) + (0.25 \times \text{Performance}) + (0.25 \times \text{Clean Code}) + (0.20 \times \text{DGA Compliance})$$

> **Note:** Deterministic **Mandatory Override Rules** automatically trigger penalties or failures if critical vulnerabilities are flagged, ensuring high weighted averages cannot bypass critical compliance gates.

---

## Evaluation & Benchmarks

Miqyas was benchmarked against a custom **Golden Dataset** consisting of 59 manually engineered code samples:

| Metric | Result |
| :--- | :--- |
| **Rating Accuracy** | 91.5% |
| **Score Accuracy** | 93.2% |
| **Golden Dataset Size** | 59 samples |
| **Analysis Latency** | 8–14 seconds |

---

## Screenshots

### Repository Upload
![Miqyas Upload Interface](docs/images/upload-interface.png)

### Evaluation Dashboard
![Miqyas Results Dashboard](docs/images/results-dashboard.png)

### Detailed Findings
![Miqyas Detailed Results](docs/images/results-details.png)

---

## Running Locally

### Backend Setup

1. Install backend dependencies:
```bash
pip install -r miqyas_api/requirements.txt
```

2. Configure environment variables in `miqyas_api/.env`:
```env
OPENAI_API_KEY=your_api_key_here
```

3. Launch the API server:
```bash
uvicorn miqyas_api.main:app --reload
```

### Frontend Setup

1. Navigate to the UI directory and install dependencies:
```bash
cd miqyas-ui
npm install
```

2. Start the development server:
```bash
npm run dev
```

---

## Security Safeguards

* **In-Memory ZIP Extraction:** Archives are unpacked directly in memory to prevent persistent storage leaks.
* **Input Boundaries:** Enforced repository size limits (20 MB) and strict character budgets (80,000 characters).
* **Extension Whitelist:** Restricts processing to supported code extensions only.
* **Dependency & Secret Filtering:** Automatic exclusion of dependency directories (`node_modules`, `venv`, etc.) and `.env` secret files.
* **Key Isolation:** Environment-based API key storage ensuring credentials are never exposed in source control.

---

## Academic Project

Miqyas AI was developed as a Computer Science graduation project at **Umm Al-Qura University**[cite: 1].

* **Author:** Reem Alwafi
* **Department:** Computer Science
* **Date:** June 2026
