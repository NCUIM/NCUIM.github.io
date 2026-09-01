<div align="center">
  <img src="public/favicon.svg" alt="CIM-Life Logo" width="96" height="96" />
  <h1>CIM-Life</h1>
  <p><b>National Central University (NCUIM) Graduate Student Portal & Survival Guide</b></p>

  <p>
    <a href="https://github.com/NCUIM/NCUIM.github.io/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/NCUIM/NCUIM.github.io/test.yml?branch=main&label=CI%20Tests&style=flat-square" alt="CI Tests" /></a>
    <a href="https://github.com/NCUIM/NCUIM.github.io/actions/workflows/policy.yml"><img src="https://img.shields.io/github/actions/workflow/status/NCUIM/NCUIM.github.io/policy.yml?branch=main&label=Policy&style=flat-square" alt="Policy" /></a>
    <a href="https://ncuim.github.io/"><img src="https://img.shields.io/badge/Deploy-GitHub%20Pages-success?style=flat-square&logo=github" alt="GitHub Pages" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://ionicframework.com/"><img src="https://img.shields.io/badge/Ionic-8.0-3880FF?style=flat-square&logo=ionic" alt="Ionic" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript" alt="TypeScript" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite" alt="Vite" /></a>
  </p>

  <p>
    <b>English</b> • <a href="README.md">繁體中文</a> • <a href="https://ncuim.github.io/">🌐 Live Demo</a>
  </p>
</div>

---

## 💡 Why CIM-Life?

Graduate life and orientation at NCUIM often involve scattered information and tedious manual processes:
* **Fragmented Course Schedules**: University CIS portal makes it difficult to grasp the entire department's weekly timetable at a glance.
* **Complex Credit Calculation**: Core requirements, elective domain minimums, and waiver caps are complicated and error-prone to tally by hand.
* **Finding Lab Seats**: Navigating large graduate research rooms (209, 310, 313, 919) to find specific advisors' students or colleagues is frustrating without a visual map.
* **Orientation Seating Lottery**: Arranging seat drawings while guaranteeing lab group cohesion and serpentine adjacency used to require manual spreadsheets.

**CIM-Life** is a **mobile-first, zero-backend, privacy-centric single-page web app** designed to solve these pain points seamlessly.

---

## ✨ Key Features

### 📅 1. Smart Weekly Timetable & CIS Sync (`/timetable`)
- **Department Master Schedule & Personal Timetable**: Toggle between department-wide offerings and enrolled courses with both daily and full-week grid views.
- **Smart Merged Multi-Section Cards**: Automatically merges courses with identical titles and time slots into unified cards with clear teacher-classroom pairings and enrolled section underlining.
- **One-Click CIS Bookmarklet Sync**: Securely parse course records directly from NCU CIS portal without entering credentials.

### 🎓 2. Graduation Credit Calculator (`/tools/credit`)
- **Automated Curriculum Review**: Built-in rules verify core required credits, elective categories, and graduation deficits in real time.
- **Credit Waiver Tracking**: Log waived/transferred credits with live progress tracking.

### 🗺️ 3. Realistic Lab Floor Plan (`/seats`)
- **Authentic Room Layouts**: Accurately reproduces physical dimensions, entryways, printers, and structural pillars for 209, 310, 313, and 919.
- **Instant Search & Highlighting**: Locate any graduate student or advisor with instant seat highlighting.

### 🎲 4. Seating Lottery Ceremony Stage (`/stage/lottery`)
- **Serpentine Adjacency Solver**: Backtracking algorithm guarantees all lab members sit together in the same room without splitting.
- **Audience Stage Mode**: Fullscreen projection UI with rolling animations, live capacity gauges, and celebratory particle effects.

### 🍜 5. Freshman Survival Guide & Campus Food Map (`/guide`, `/food`)
- **Freshman Checklist**: Timelines, enrollment procedures, and software perks (GitHub Student Pack, JetBrains, etc.).
- **Midnight Snack Wheel**: Curated dining recommendations around NCU Back Gate and Midnight Snack Street to solve decision paralysis.

---

## ⚡ 1-Minute Quick Start

### Method A: No Install, Use Online 🌐
Open the live GitHub Pages app directly:  
👉 **[https://ncuim.github.io](https://ncuim.github.io)**

### Method B: Run Locally 💻
```bash
# 1. Clone repository
git clone https://github.com/NCUIM/NCUIM.github.io.git
cd NCUIM.github.io

# 2. Install dependencies (installs Git commit hooks automatically)
npm install

# 3. Start local development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔒 Zero-Backend & 100% Client Privacy

- **Pure Static SPA**: Hosted on GitHub Pages global CDN with instant loading and 100% uptime.
- **Data Stays Local**: Your course selections, transcripts, and calculated credits are **stored exclusively in your browser's LocalStorage**. Zero server transmission, zero leakage risks.

---

## 🛠️ Testing & Quality Assurance

```bash
npm run typecheck    # TypeScript strict check
npm test             # Run Vitest unit tests (44+ tests passing)
npm run test:docs    # Verify Markdown links and single-source rules
npm run test:policy  # Self-test commit policy rules
npm run build        # Production bundle build
```

---

## 🤝 Contributing

Contributions and feedback are welcome! Please review:
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution workflow
- [docs/engineering/commit-policy.md](docs/engineering/commit-policy.md) — Conventional Commits policy (**all commits and PRs must be in English**)
- [docs/engineering/testing-policy.md](docs/engineering/testing-policy.md) — Testing strategy and acceptance criteria


