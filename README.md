# ChIPONChallenge

ChIPONChallenge is a gamified daily savings app built with React, Vite, and Tailwind CSS.

The app combines:

- a once-per-day mandatory savings spin
- a one-add-on-per-day bonus spin
- automatic savings goal calculation
- local persistence with `localStorage`
- a challenge progress tracker
- a daily savings log
- optional discipline penalties for missed days

## Core idea

The challenge is based on a total number of days selected by the user.

Example:

- if `Total days = 100`
- the main wheel spins from `1` to `100`
- if the wheel lands on `34`
- the mandatory savings amount becomes `₱34`

That means:

- picked day number = mandatory savings amount
- first spin is always `Challenge Day 1`
- second spin is `Challenge Day 2`
- third spin is `Challenge Day 3`

The random number is used for the daily mandatory contribution, while the challenge day is the player’s actual progress through the challenge.

## Main features

### 1. Daily mandatory spin

- one main spin per calendar day
- wheel uses the full configured day range
- selected wheel number becomes the required savings amount
- the spin is locked after it is used

### 2. Bonus add-on spin

- one bonus add-on spin per day
- available only after the main mandatory spin
- inline circular wheel, no modal
- chosen add-on is automatically applied when the wheel stops

### 3. Challenge progress

- challenge days progress sequentially: `Day 1`, `Day 2`, `Day 3`, ...
- assigned wheel result is tracked separately from challenge progress
- total saved, remaining days, and today’s total are displayed

### 4. Automatic savings goal

The savings goal is automatically computed from:

`1 + 2 + 3 + ... + n`

Example:

- `10 days` = `55`
- `100 days` = `5050`

### 5. Discipline mode

- optional toggle
- missed days add a `₱10 penalty` per skipped day
- penalty is added to the next mandatory entry

### 6. Daily log

Each log item shows:

- challenge day
- date
- total amount saved that day
- mandatory amount
- penalty if any
- add-on if any

### 7. Local persistence

The app stores progress in browser `localStorage`, including:

- total days
- auto-calculated goal
- add-on options
- completed assigned days
- entries
- total money
- last spin date
- discipline mode state

## How the app works

### Main spin flow

1. User sets `Total days`
2. User clicks `Spin Today`
3. App randomly selects one unused day from the configured range
4. Selected number becomes the mandatory savings amount
5. Entry is stored and the day is locked

### Bonus spin flow

1. User completes the main spin
2. Bonus wheel becomes available
3. User spins once
4. Add-on is applied automatically
5. Bonus wheel locks for the rest of the day

## Current rules

- main spin: `1 per day`
- bonus spin: `1 per day`
- challenge days are sequential
- selected main wheel number = mandatory amount
- no undo buttons in the UI after locking

## Tech stack

- React 19
- Vite 8
- Tailwind CSS 3
- PostCSS
- ESLint
- GitHub Pages via GitHub Actions

## Project structure

### UI

- `src/App.jsx`

Main screen, wheels, cards, tracker, daily log, settings panel, real-time clock, and interaction logic.

### State and business logic

- `src/useChiponChallenge.js`

Handles:

- challenge state
- local persistence
- spin logic
- add-on logic
- goal calculation
- date checks
- discipline mode

### Styling

- `src/index.css`
- `tailwind.config.js`
- `postcss.config.js`

### Build and tooling

- `vite.config.js`
- `package.json`
- `eslint.config.js`

### Deployment

- `.github/workflows/deploy-pages.yml`

## State model

The main state includes:

```json
{
  "totalDays": 100,
  "goal": 5050,
  "addonOptions": [5, 10, 15, 20, 25, 30],
  "completedDays": [34, 80],
  "entries": [
    {
      "id": "2026-03-29-34",
      "assignedDay": 34,
      "challengeDay": 1,
      "mandatory": 34,
      "penalty": 0,
      "addons": [10],
      "total": 44,
      "date": "2026-03-29"
    }
  ],
  "totalMoney": 44,
  "lastSpinDate": "2026-03-29",
  "disciplineMode": false
}
```

## Local development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

## Production build

Create a production build:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## GitHub Pages deployment

This project is configured for GitHub Pages using GitHub Actions.

### Important

- Do not use `Deploy from a branch` with `main` and `/root` for this Vite source project.
- GitHub Pages does not run `npm install` or `vite build` from branch root.
- Use `GitHub Actions` as the publishing source.

### Pages setup

1. Open the repository on GitHub
2. Go to `Settings -> Pages`
3. Under `Build and deployment`, set `Source` to `GitHub Actions`
4. Push to `main`

The workflow will:

- install dependencies
- build the app
- upload the `dist/` output
- deploy the site to GitHub Pages

### Deployment files

- `.github/workflows/deploy-pages.yml`
- `vite.config.js`

`vite.config.js` uses:

```js
base: './'
```

This ensures built asset paths work correctly on GitHub Pages.

## Current UI tools/components

The app currently includes:

- circular day wheel
- circular bonus reel
- real-time date and clock display
- challenge rule settings panel
- auto goal preview
- discipline mode toggle
- progress bars
- savings stat cards
- achievement badges
- daily log cards

## Notes

- Existing old entries from previous local data are normalized when loaded.
- The app is browser-based and stores data locally on the device.
- If local storage is cleared, challenge progress resets unless backed up elsewhere.

## Future improvements

Possible next upgrades:

- exact wheel landing animation with slowdown physics
- sound effects
- theme customization
- export/import challenge data
- streak history analytics
- milestone notifications
- backend sync and authentication
