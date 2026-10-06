# 🚀 Custom PowerShell Build Pipeline

A production-grade, lightweight, and dependency-free build pipeline orchestrated entirely via PowerShell.

## 📌 Project Overview

This project compiles a modern web stack using native CLI tools without relying on heavy bundlers like Webpack, Gulp, or Vite. It converts:

- **HAML** → HTML
- **Stylus** → CSS
- **TypeScript** → JavaScript

## 🧪 Running the TypeScript unit tests

Install the test dependencies once, then run the tests from the project root:

```bash
npm install
npm test
```

The unit suite uses Vitest and jsdom to cover booking date validation, request payload creation,
booking form submission and errors, destination preselection, and mobile navigation behavior.
Integration tests render the HAML page and exercise complete interactions across the page scripts.
Component tests mount isolated navigation widgets and check their user interactions and state.
The booking API contract test validates the actual frontend request against the OpenAPI contract in
`contracts/booking-api.openapi.json`. These tests verify the frontend's expectations; provider
verification requires running the backend against the same contract.
Run the non-browser tests with `npm test`, browser E2E tests separately with `npm run test:e2e`,
component tests with `npm run test:component`, integration tests with
`npm run test:integration`, contract tests with `npm run test:contract`, or use `npm run test:watch`
while editing. HAML-backed tests require the HAML CLI.

Generate a TypeScript coverage summary plus HTML and LCOV reports with:

```bash
npm run test:coverage
```

Open `coverage/index.html` for the browsable report. The LCOV report is written to
`coverage/lcov.info`.

Generate a separate report using only the full-page integration tests with:

```bash
npm run test:coverage:integration
```

This report covers the booking and navigation modules exercised by those flows and is written to
`coverage/integration/index.html` and `coverage/integration/lcov.info`.

Generate a separate report using only the booking API contract tests with:

```bash
npm run test:coverage:contract
```

The report covers the booking modules exercised by the contract tests and is written to
`coverage/contract/index.html` and `coverage/contract/lcov.info`.

Generate a separate report using only the UI component tests with:

```bash
npm run test:coverage:component
```

The report covers the navigation module exercised by those tests and is written to
`coverage/component/index.html` and `coverage/component/lcov.info`.

Generate browser-execution coverage from the end-to-end tests with:

```bash
npx playwright install chromium
npm run test:coverage:e2e
```

This rebuilds the app with source maps, collects Chromium JavaScript coverage during the browser
tests, and writes HTML and LCOV reports under `coverage/e2e/`, mapped back to the TypeScript source.

## 🧬 Running mutation tests

Mutation testing changes production code in small ways to check that the tests detect regressions.
Run it with:

```bash
npm run test:mutation
```

The current mutation target is the isolated booking validation and request-construction logic in
`src/ts/booking-utils.ts`. Stryker runs the relevant Vitest tests and writes an HTML score report
under `reports/mutation/`.

## 🌐 Running end-to-end browser tests

Install dependencies and the Playwright Chromium browser once, then run the full browser suite:

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

The E2E command builds the HAML, Stylus, and TypeScript sources into `dist/`, starts a local Vite
server, and runs browser tests against Chromium. The booking API is intercepted in the test, so no
backend server or live booking submission is needed.

## 📦 Required Installations & Dependencies

To use this pipeline, your system must have the underlying runtimes installed:

1. **Ruby** (required for HAML)
2. **Node.js & npm** (required for Stylus and TypeScript)

### Installation Steps

## 1. HAML (via RubyGems)

```bash
gem install haml

```

**2. Stylus & TypeScript (via npm)**
**Recommended Modern Approach (Local Tooling):**
Best practice dictates installing Node dependencies locally to the project so every developer uses the exact same versions.

```bash
npm install stylus typescript --save-dev

```

*(Note: If installed locally, you would prefix the commands in the scripts with `npx`, e.g., `npx tsc` instead of `tsc`).*

**Alternative (Global Installation):**
If you prefer the tools to be available system-wide:

```bash
npm install -g stylus typescript

```

## 🔐 Windows-Specific Notes & Execution Policy

By default, Windows restricts the execution of custom PowerShell scripts for security reasons. To run this pipeline safely, you must allow locally created scripts to run.

Open PowerShell as an Administrator and run:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

```

*This allows you to run scripts you write yourself, while still requiring downloaded scripts to be signed by a trusted publisher.*

## 🚀 How to Run the Scripts

Because these scripts use `$PSScriptRoot` to dynamically resolve their location, **they are completely portable**. You can execute them from the project root, from inside the `scripts/` folder, or from anywhere else on your machine, and they will still resolve paths correctly.

### Run the Full Pipeline

The orchestrator script runs HAML, Stylus, and TypeScript in strict sequential order.

```powershell
.\scripts\build.ps1

```

### Run Individual Build Steps

```powershell
# Compile HAML only
.\scripts\build-haml.ps1

# Compile Stylus only
.\scripts\build-stylus.ps1

# Compile TypeScript only
.\scripts\build-ts.ps1

```

## 🧹 How to Clean `dist/`

To safely clean your build output, simply delete the `dist` folder. The PowerShell scripts automatically check for its existence and will safely regenerate it on the next build run.

```powershell
Remove-Item -Recurse -Force .\dist\

```

## 🏗️ Script Architecture Explanation

This pipeline is built on a **strict separation of concerns**:

- `build-haml.ps1`, `build-stylus.ps1`, and `build-ts.ps1` contain the isolated logic for their respective tools. They validate dependencies, execute commands, and handle errors.
- `build.ps1` is purely an orchestrator. It uses dot-sourcing (`. .\script.ps1`) to trigger the individual steps, meaning there is zero duplication of logic.
- **Fail-Fast:** All scripts enforce `Set-StrictMode -Version Latest` and `$ErrorActionPreference = "Stop"`. If a single step fails (e.g., a syntax error in your Stylus file), the entire pipeline stops immediately to prevent broken builds.

## 🌍 Cross-Platform Considerations (macOS & Linux)

This pipeline works perfectly on macOS and Linux using **PowerShell Core (`pwsh`)**.

- The scripts use `Join-Path` instead of hardcoded slashes (`\` or `/`), ensuring file paths format correctly regardless of the operating system.
- To run on Unix systems, simply use:

```bash
pwsh ./scripts/build.ps1

```

## 🆘 Troubleshooting

**Error: `haml/stylus/tsc is not recognized as the name of a cmdlet**`

- **Cause:** The CLI tool is not installed, or it is not added to your system's `PATH`.
- **Fix:** Ensure you ran the installation commands. If installed via npm locally, modify the `.ps1` scripts to use `npx stylus` instead of `stylus`.

**Error: `File build.ps1 cannot be loaded because running scripts is disabled on this system.**`

- **Cause:** Windows Execution Policy is blocking the script.
- **Fix:** Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell.

## Error: Pipeline fails silently or paths are wrong

- **Cause:** Executing the script via legacy methods that don't respect `$PSScriptRoot`.
- **Fix:** Always run the scripts natively in a modern PowerShell session (PowerShell 5.1+ or PowerShell Core 7+).
