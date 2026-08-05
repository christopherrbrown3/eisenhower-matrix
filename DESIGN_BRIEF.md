# Eisenhower Matrix — MVP Design Brief

Status: Implemented for the MVP.

## 1. Feature Summary

A lightweight, responsive Eisenhower Matrix for an individual manager. It runs entirely in the browser, persists tasks in local storage, and ships to GitHub Pages as static vanilla HTML, CSS, and JavaScript with no framework, backend, account, or build step.

The product is grounded in the distinction between urgency and importance described in the [HBS Online prioritization guide](https://online.hbs.edu/blog/post/how-to-prioritize-tasks): managers should avoid letting the loudest demand displace work that creates lasting value.

## 2. Primary User Action

Capture a task, answer two questions, and immediately see it placed in the correct quadrant.

The composer asks:

1. **Is it important?** Does it meaningfully advance a goal or prevent a consequential problem?
2. **Is it urgent?** Does it need attention soon or carry immediate consequences?

Importance comes first to reduce the tendency to treat pressure as priority. A live destination label updates after both choices are made.

| Important | Urgent | Destination | Recommended action |
| --- | --- | --- | --- |
| Yes | Yes | Do now | Act on it |
| Yes | No | Schedule | Protect it |
| No | Yes | Delegate | Park it for handoff |
| No | No | Eliminate | Reconsider or remove it |

Dragging a task into another quadrant updates its importance and urgency values to match the destination.

## 3. Design Direction

Use the selected **Quiet Matrix** direction: a restrained, typographically led interface that keeps the familiar two-by-two matrix visible on desktop and becomes four stacked sections on mobile.

- Color strategy: restrained true-white surface, near-black type, moss/olive primary action color, and very pale semantic tints for the four quadrants.
- Scene: a manager at a bright desk between meetings who needs immediate, quiet clarity.
- References: Things 3 for focus and hierarchy, Linear for interaction precision, and Swiss wayfinding for legibility.
- Typography: one carefully tuned system sans-serif stack for fast loading and a native feel; hierarchy comes from size, weight, spacing, and rhythm rather than decorative type.
- Personality: focused, confident, and quietly playful—never whimsical, busy, beige, or visibly assembled from common AI design patterns.

## 4. Scope

- Fidelity: production-ready MVP.
- Breadth: one responsive app surface.
- Interactivity: shipped-quality task creation, editing, completion, deletion, and reclassification.
- Persistence: browser local storage only.
- Deployment: static GitHub Pages site using relative asset paths.

Out of scope: dates, weekly reviews, notes, projects, tags, subtasks, reminders, calendars, accounts, cloud sync, collaboration, delegation tracking, AI features, analytics, and import/export.

## 5. Layout Strategy

### Desktop

- A compact header contains the product name, an unobtrusive completed-task toggle, and the primary **Add task** action.
- The add action expands an inline composer below the header; it does not open a modal.
- The matrix fills the remaining viewport as four adjoining zones separated by structural rules, not four floating cards.
- Reading order is Do now, Schedule, Delegate, Eliminate.
- Each quadrant header pairs its action name with a plain-language rule such as “Important + urgent.”
- Tasks are clean rows with a completion control, title, and drag affordance. Secondary actions appear on focus or hover without cluttering the default state.

### Mobile

- The four quadrants stack vertically in the same priority order.
- A sticky bottom **Add task** control remains thumb-accessible when the keyboard is closed.
- Quadrant labels and task counts remain visible while scanning.
- Long-press drag supports touch reclassification; an explicit **Move to…** action provides a reliable and accessible alternative.

## 6. Key States

- **First use:** A short explanation—“Add a task. Answer two questions. We’ll place it.”—with one primary action.
- **Empty quadrant:** Quiet, action-specific copy such as “Nothing needs immediate attention.”
- **Creating:** Title input, two unanswered binary choices, disabled submit button, and no assumed quadrant.
- **Classified:** A live “Goes to: Schedule” preview appears once both choices are answered.
- **Created:** The new task arrives in its quadrant with a brief placement animation and clear focus.
- **Dragging:** The task lifts slightly; valid zones gain a crisp outline and descriptive label.
- **Moved:** The task snaps into place and its stored urgency/importance values update.
- **Completed:** A check draws, the row receives a short moss highlight, and then collapses from the active list. “Show completed” makes it recoverable.
- **Deleted:** The row is removed and a compact undo toast appears.
- **Storage unavailable:** A persistent, plain-language warning explains that changes cannot be saved.
- **Corrupt stored data:** Preserve the unreadable payload under a recovery key, reset safely, and tell the user what happened.

## 7. Interaction Model

- Clicking **Add task** or pressing `N` opens the inline composer and focuses the title field.
- The user enters a title, answers Important and Urgent with explicit Yes/No controls, reviews the destination, and presses Enter or **Add task**.
- Clicking a task title edits it inline. Escape cancels; Enter saves.
- Checking a task completes it. Completed tasks are hidden by default but can be shown and restored.
- Dragging or using **Move to…** reclassifies a task. Desktop mouse, touch pointer, and keyboard users all receive equivalent behavior.
- Deleting uses undo rather than a confirmation dialog.
- Cross-tab updates use the browser `storage` event so two open tabs do not silently drift apart.

## 8. Motion and Feedback

Motion rewards progress and clarifies state; it does not decorate the page.

- Composer expansion: 180–220 ms ease-out.
- Automatic placement: a short directional transition into the chosen quadrant.
- Dragging: lift, destination outline, and a precise snap on drop.
- Completion: check-draw, moss wash, and a compact removal transition.
- Undo: subtle toast entrance and exit.
- No confetti, bounce, elastic motion, page-load choreography, or looping effects.
- `prefers-reduced-motion` replaces movement with instant state changes or short crossfades.

## 9. Content Requirements

Core labels:

- **Do now** — Important + urgent
- **Schedule** — Important, not urgent
- **Delegate** — Urgent, not important
- **Eliminate** — Neither important nor urgent

The Delegate quadrant is only a parking area in the MVP. It has no assignee, handoff, or follow-up fields.

All instructional copy should be brief, managerial, and direct. The app should teach the distinction between importance and urgency without turning into a tutorial.

## 10. Technical Approach

- `index.html` for the semantic app shell and no-JavaScript fallback message.
- `styles.css` for tokens, responsive layout, component states, and reduced-motion behavior.
- ES-module JavaScript split by responsibility: application state/rendering, local-storage persistence, task composer, and pointer/keyboard movement.
- Versioned storage key and schema, for example `eisenhower-matrix:v1`.
- Task data: stable ID, title, important, urgent, completed, order, created timestamp, and updated timestamp. Timestamps are internal metadata and never shown in the MVP.
- Pointer Events rather than desktop-only HTML drag-and-drop so reclassification works on touch devices.
- Semantic buttons, fieldsets, visible focus rings, live-region announcements, and color-independent quadrant labels.
- Relative URLs only, ensuring correct behavior under a GitHub Pages repository subpath.

## 11. Acceptance Criteria

- A task cannot be created until it has a non-empty title and both questions are answered.
- Every Yes/No combination maps deterministically to the correct quadrant.
- Reloading the page preserves active and completed tasks.
- Editing, completing, deleting, restoring, and moving a task persist immediately.
- Moving a task changes its stored urgency and importance values correctly.
- All primary actions work with mouse, touch, and keyboard.
- Desktop displays a legible two-by-two matrix; mobile displays usable stacked quadrants without horizontal scrolling.
- The UI remains understandable without color and respects reduced-motion preferences.
- The deployed site works from a GitHub Pages project path with no server routes or build pipeline.

## 12. Recommended Implementation References

Use the impeccable `layout`, `animate`, `adapt`, and `harden` references during implementation, followed by an accessibility and responsive audit.

## 13. Open Questions

None. The brief is ready for confirmation.
