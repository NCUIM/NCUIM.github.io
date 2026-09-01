# CIM-Life (NCUIM Graduate Student Portal & Freshman Survival Guide)

[![CI Tests](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/test.yml/badge.svg)](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/test.yml)
[![Repository Policy](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/policy.yml/badge.svg)](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/policy.yml)
[![Deploy to GitHub Pages](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/deploy-pages.yml)
[![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://react.dev/)
[![Ionic](https://img.shields.io/badge/Ionic-8.0-3880ff.svg?logo=ionic)](https://ionicframework.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite)](https://vitejs.dev/)

> **National Central University, Department of Information Management (NCUIM)**  
> **Graduate Student Comprehensive Portal & Freshman Survival Guide (CIM-Life)**  
> A mobile-first, privacy-oriented Single Page Application designed for NCUIM graduate students, integrating master's curriculum schedules, credit calculation, campus survival guides, lab floor layouts, and seating lottery tools.

[繁體中文說明文件](README.md)

---

## 🌟 Key Features

### 1. 📅 Master's Curriculum Schedule & CIS Sync (`/timetable`)
- **Department Overview & Personal Weekly Timetable**: Toggle between department-wide course offerings and personal enrolled courses with both daily and weekly views.
- **One-Click CIS Bookmarklet Sync**: Securely parse and synchronize enrolled and historical course records directly from NCU Portal/CIS without manual data entry.
- **Smart Merged Multi-Section Cards**: Automatically merges courses with identical titles and time slots (e.g. *Management Communication*) into a single unified block with clear teacher-classroom pairings and enrolled section underlining.
- **Clear Year 1 / Year 2 Required Badges**: Explicitly marks core required vs. elective courses for intuitive curriculum planning.

### 2. 🎓 Graduation Credit Calculator (`/tools/credit`)
- **Curriculum Requirement Verification**: Automatically evaluates accumulated credits against NCUIM master's graduation requirements across required and elective domain categories.
- **Credit Waiver & Historical Course Tracking**: Easily log transferred/waived credits and inspect remaining credit requirements in real time.

### 3. 🧭 Freshman Survival Guide & Campus Life Tools (`/guide`, `/food`)
- **NCUIM Survival Guide**: Course registration strategies, critical university links, and freshman checklists.
- **Campus Food & Dining Map**: Curated dining recommendations around NCU Back Gate, Midnight Snack Street, Front Gate, and on-campus cafeterias.

### 4. 🗺️ Lab Seating Layout & Stage Lottery (`/seats`, `/stage/lottery`)
- **Interactive Lab Seating Floor Plan**: Visualized laboratory layout with desk and seat allocations.
- **Lottery Ceremony Stage Mode**: Live drawing projection interface with serpentine adjacent seat distribution algorithms.

---

## 🏗️ Architecture & Technology Stack

The project is built as a pure client-side static Single Page Application (SPA), delivering instant loading performance, offline resilience, and zero privacy leakage risks.

| Category | Technology |
| --- | --- |
| **Frontend Framework** | [React 18](https://react.dev/) + [Ionic Framework v8](https://ionicframework.com/) |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) (Strict Mode) |
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Unit Testing** | [Vitest](https://vitest.dev/) + [@testing-library/react](https://testing-library.com/) |
| **End-to-End Testing** | [Playwright](https://playwright.dev/) |
| **CI / CD** | GitHub Actions (automated policy checks, security scans, and GitHub Pages deployment) |
| **Hosting** | [GitHub Pages](https://pages.github.com/) |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** `>= 20.6.0`
- **npm** `>= 10.0.0`

### Installation & Development
```bash
# 1. Clone the repository
git clone https://github.com/NCUIM/NCUIM.github.io.git
cd NCUIM.github.io

# 2. Install dependencies (automatically installs Git commit hooks)
npm install

# 3. Start local development server
npm run dev
```
Open `http://localhost:5173` in your browser to view the application.

---

## 🧪 Testing & Quality Assurance

To ensure codebase stability and release quality, automated checks are enforced:

```bash
# Run TypeScript typecheck
npm run typecheck

# Run unit and component test suites (Vitest)
npm test

# Generate test coverage report
npm run test:coverage

# Run documentation integrity verification
npm run test:docs

# Run commit and PR policy self-test
npm run test:policy

# Build production bundle
npm run build
```

---

## 🤝 Contributing

Contributions and bug reports are welcome! Please review our contribution guidelines before opening a pull request:
- [CONTRIBUTING.md](CONTRIBUTING.md) — Workflow and commit standards
- [docs/engineering/commit-policy.md](docs/engineering/commit-policy.md) — Conventional Commits policy specification
- [docs/engineering/testing-policy.md](docs/engineering/testing-policy.md) — Testing strategy and acceptance criteria

