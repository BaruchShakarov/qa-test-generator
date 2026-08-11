# Caseflow — AI QA test case generator

Paste a user story or requirement, get back classified test cases (positive / negative / edge)
and a ready-to-run Playwright spec — in seconds instead of the 30-60 minutes it usually takes
a QA engineer to translate a requirement into a structured test suite manually.

**Live demo:** _add your Railway URL here after deploying_

## Why this exists

Writing a solid first-pass test suite from a requirement is repetitive and time-consuming,
even for experienced QA engineers — you're translating the same mental checklist (happy path,
invalid input, boundary conditions) into prose and code every time. This tool automates that
first pass so a human QA engineer can spend their time on the cases that actually need judgment,
not on typing out the obvious ones.

## How it works

1. A user story is submitted through the frontend.
2. The Flask backend sends it to the Claude API with a system prompt tuned for QA test design
   (trained on the categories a real test plan needs: positive, negative, edge).
3. Claude returns structured JSON: a list of test cases plus a runnable Playwright spec.
4. The frontend renders the cases as a filterable list and the code in a copyable panel.

The API key lives only on the server — it is never exposed to the browser.

## Tech stack

- **Backend:** Python, Flask, Anthropic SDK
- **Frontend:** vanilla HTML/CSS/JS (no build step)
- **AI:** Claude (Sonnet)
- **Deployment:** Railway

## Running locally

```bash
git clone https://github.com/BaruchShakarov/qa-test-generator.git
cd qa-test-generator
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # then add your ANTHROPIC_API_KEY
python app.py
```

Open `http://localhost:5001`.

## Deploying to Railway

1. Push this repo to GitHub.
2. Create a new Railway project from the repo.
3. Add an environment variable: `ANTHROPIC_API_KEY`.
4. Railway detects the `Procfile` and deploys automatically.

## Example

**Input:**
> As a registered user, I want to reset my password via email so that I can regain access to
> my account if I forget it.

**Output:** 6-9 classified test cases (e.g. valid email → reset link sent, unregistered email →
generic confirmation shown for security, expired reset token → rejected with clear message) plus
a Playwright spec for the top cases.

## Roadmap

- [ ] Export test cases to Jira / CSV
- [ ] Support Cypress and Selenium output formats, not just Playwright
- [ ] Save/history of past generations
- [ ] Auth + per-user usage limits (for a paid tier)

## About

Built by [Baruch Shakarov](https://github.com/BaruchShakarov), a QA automation engineer with
8+ years of experience in manual and automated testing (Python, Selenium, Playwright, API
testing), exploring the intersection of QA and applied AI.
