# Eisenhower Matrix

A focused, local-first task prioritization tool for individual managers. It turns competing responsibilities into four clear actions: **do now, schedule, delegate, or eliminate**.

[Open the live app](https://christopherrbrown3.github.io/eisenhower-matrix/)

## Why it exists

Managers rarely lack tasks; they lack a quiet way to distinguish meaningful work from loud work. Eisenhower Matrix is designed to make that decision quickly, without introducing another account, workflow system, or planning ritual.

The product asks two questions—whether a task is important and whether it is urgent—then places it automatically. From there, the matrix stays flexible: tasks can be moved as circumstances and judgment change.

## Capabilities

- **Guided task capture:** Importance is considered separately from urgency before a task can be added.
- **Automatic prioritization:** Every answer combination maps deterministically to the correct quadrant.
- **Flexible reclassification:** Drag tasks between quadrants with mouse or touch, or use the accessible Move controls.
- **Simple task lifecycle:** Edit, complete, restore, delete, and undo without opening a complex detail view.
- **Local-first persistence:** Tasks stay in the current browser using versioned `localStorage`; there is no account or cloud database.
- **Resilient storage:** Invalid saved records are isolated, valid tasks are preserved, and cross-tab changes are detected.
- **Responsive interface:** The desktop matrix becomes four legible stacked sections on mobile without losing functionality.
- **Accessible interaction:** Keyboard shortcuts, semantic controls, visible focus states, live announcements, and reduced-motion support are built in.
- **Static deployment:** The app ships as plain HTML, CSS, and JavaScript with no framework, backend, or runtime dependencies.

## How the matrix works

| Important | Urgent | Quadrant | Action |
| --- | --- | --- | --- |
| Yes | Yes | **Do now** | Act on it |
| Yes | No | **Schedule** | Protect time for it |
| No | Yes | **Delegate** | Park it for handoff |
| No | No | **Eliminate** | Reconsider or remove it |

## Product goals

1. **Create clarity under pressure.** Make the next useful action obvious without rewarding whichever task is loudest.
2. **Keep prioritization lightweight.** A manager should be able to turn an unruly list into a credible plan in under a minute.
3. **Stay calm and engaging.** Typography, color, and purposeful motion should reward progress without turning productivity into a game.
4. **Respect privacy by default.** Personal management tasks should not leave the browser unless the product explicitly adds an opt-in sync model later.
5. **Work equally well at a desk or between meetings.** Core capture, movement, and completion flows must remain usable on narrow touch screens.

## MVP boundaries

This version intentionally has no dates, reminders, weekly reviews, projects, tags, notes, subtasks, accounts, collaboration, analytics, AI features, or cloud sync. The Delegate quadrant is a decision area, not an assignment workflow.

## Run locally

Open `index.html` directly, or run a small local server:

```sh
npm run serve
```

Then open [http://localhost:4173](http://localhost:4173).

No dependency installation is required. If you change the modular JavaScript source, rebuild the browser-ready entry point with `npm run build`.

## Verify the app

```sh
npm run check
```

The checks rebuild the browser entry point, then use Node's built-in test runner and syntax checker. They cover classification, task operations, state normalization, local-storage availability, persistence, recovery, and external updates.

## Data and privacy

The app has no account, analytics, remote API, or cloud database. Tasks are stored under the versioned browser key `eisenhower-matrix:v1`. Clearing site data for the app also clears the matrix.

## Background

The product is informed by the distinction between importance and urgency described in the [Harvard Business School Online guide to prioritizing tasks](https://online.hbs.edu/blog/post/how-to-prioritize-tasks).

Additional product and interaction decisions are documented in [PRODUCT.md](PRODUCT.md) and [DESIGN_BRIEF.md](DESIGN_BRIEF.md).
