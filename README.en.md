<div align="center">
  <img src="public/favicon.svg" alt="CIM-Life Logo" width="80" height="80" />
  <h1>CIM-Life</h1>
  <p>National Central University (NCUIM) Graduate Student Portal & Survival Guide</p>

  <p>
    <a href="https://github.com/NCUIM/NCUIM.github.io/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/NCUIM/NCUIM.github.io/test.yml?branch=main&label=CI&style=flat-square" alt="CI" /></a>
    <a href="https://ncuim.github.io/"><img src="https://img.shields.io/badge/Online-ncuim.github.io-blue?style=flat-square" alt="Online" /></a>
    <a href="https://github.com/NCUIM/NCUIM.github.io/blob/main/LICENSE"><img src="https://img.shields.io/github/license/NCUIM/NCUIM.github.io?style=flat-square" alt="License" /></a>
  </p>

  <p>
    <a href="README.md">繁體中文</a> | <b>English</b>
  </p>
</div>

---

**CIM-Life** is a web application designed for graduate students in the Department of Information Management at National Central University (NCUIM). It integrates department course schedules, personal timetable management, graduation credit checking, lab floor plans, and campus survival resources.

It is built as a pure client-side single-page application (SPA). All personal course data and credit records are stored locally in your browser (LocalStorage) without any backend server transmission.

## Features

### Timetable & CIS Sync (`/timetable`)
- **Department Master Schedule & Personal Weekly Timetable**: Toggle between department-wide offerings and enrolled courses with both grid and daily views.
- **Smart Merged Multi-Section Cards**: Automatically merges courses with identical titles and time slots into unified cards with teacher-classroom pairings and enrolled section underlining.
- **CIS Bookmarklet Sync**: Securely parse course records directly from NCU CIS portal without entering credentials.

### Graduation Credit Calculator (`/tools/credit`)
- **Curriculum Requirement Verification**: Automatically evaluates accumulated credits against NCUIM master's graduation requirements across required and elective categories.
- **Credit Waiver Tracking**: Log waived/transferred credits with real-time deficit calculation.

### Lab Floor Plans (`/seats`)
- **Physical Room Layouts**: Interactive floor plans for 209 (20 seats), 310 (27 seats), 313 (23 seats), and 919 (9 seats).
- **Seat & Member Search**: Instant highlighting by student name or advisor.

### Survival Guide & Campus Life (`/guide`, `/food`)
- **Freshman Checklist & Links**: Timeline of key procedures, software benefits, and essential campus portals.
- **Campus Dining Guide**: Curated food recommendations and operating hours around NCU Back Gate and Midnight Snack Street.

## Online Usage

Use the web app directly without installation:
**https://ncuim.github.io**

## Local Development

### Prerequisites
- Node.js >= 20.6.0
- npm >= 10.0.0

### Getting Started
```bash
git clone https://github.com/NCUIM/NCUIM.github.io.git
cd NCUIM.github.io
npm install
npm run dev
```

The development server runs at `http://localhost:5173`.

### Testing & Building
```bash
npm run typecheck    # TypeScript type checking
npm test             # Unit tests (Vitest)
npm run test:docs    # Documentation link integrity check
npm run test:policy  # Commit policy self-test
npm run build        # Build production bundle
```

## Contributing

Please review before submitting a Pull Request:
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution workflow
- [docs/engineering/commit-policy.md](docs/engineering/commit-policy.md) — Conventional Commits policy (commit messages and PR titles must be in English)
- [docs/engineering/testing-policy.md](docs/engineering/testing-policy.md) — Testing strategy and acceptance criteria



