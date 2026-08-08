import test from "node:test";
import assert from "node:assert/strict";

import {
  addTask,
  cleanTitle,
  createEmptyState,
  deleteTask,
  editTaskTitle,
  moveTask,
  normalizeState,
  quadrantFor,
  reorderTask,
  restoreDeletedTask,
  setTaskCompleted,
  signalsForQuadrant,
  tasksForQuadrant,
} from "../js/model.js";

const fixedOptions = {
  now: 100,
  idFactory: () => "task-1",
};

test("maps every importance and urgency combination to one quadrant", () => {
  assert.equal(quadrantFor({ important: true, urgent: true }), "do");
  assert.equal(quadrantFor({ important: true, urgent: false }), "schedule");
  assert.equal(quadrantFor({ important: false, urgent: true }), "delegate");
  assert.equal(quadrantFor({ important: false, urgent: false }), "eliminate");
  assert.equal(quadrantFor({ important: null, urgent: true }), null);
});

test("quadrant signals round-trip through the classifier", () => {
  for (const quadrantId of ["do", "schedule", "delegate", "eliminate"]) {
    assert.equal(quadrantFor(signalsForQuadrant(quadrantId)), quadrantId);
  }
});

test("cleans task titles without interpreting their content", () => {
  assert.equal(cleanTitle("  Review   日本語 🚀  "), "Review 日本語 🚀");
  assert.equal(cleanTitle("   "), "");
});

test("creates a classified task with stable metadata", () => {
  const result = addTask(
    createEmptyState(),
    { title: "  Review   launch brief ", important: true, urgent: false },
    fixedOptions,
  );

  assert.deepEqual(result.task, {
    id: "task-1",
    title: "Review launch brief",
    important: true,
    urgent: false,
    completed: false,
    order: 0,
    createdAt: 100,
    updatedAt: 100,
  });
  assert.equal(tasksForQuadrant(result.state, "schedule").length, 1);
});

test("rejects incomplete task classification", () => {
  assert.throws(
    () =>
      addTask(
        createEmptyState(),
        { title: "Ambiguous", important: true, urgent: null },
        fixedOptions,
      ),
    /Importance and urgency/,
  );
});

test("moving a task updates its stored signals and target order", () => {
  const first = addTask(
    createEmptyState(),
    { title: "Existing", important: false, urgent: true },
    fixedOptions,
  ).state;
  const second = addTask(
    first,
    { title: "Move me", important: true, urgent: true },
    { now: 200, idFactory: () => "task-2" },
  ).state;

  const moved = moveTask(second, "task-2", "delegate", 300);
  const task = moved.tasks.find((item) => item.id === "task-2");
  assert.equal(task.important, false);
  assert.equal(task.urgent, true);
  assert.equal(task.order, 1);
  assert.equal(task.updatedAt, 300);
});

test("reorders tasks within a quadrant and reindexes their order", () => {
  let state = createEmptyState();
  for (const [index, title] of ["First", "Second", "Third"].entries()) {
    state = addTask(
      state,
      { title, important: true, urgent: true },
      { now: index + 1, idFactory: () => `task-${index + 1}` },
    ).state;
  }
  state = addTask(
    state,
    { title: "Other quadrant", important: true, urgent: false },
    { now: 4, idFactory: () => "task-4" },
  ).state;

  const reordered = reorderTask(state, "task-3", "task-1", 500);
  const doTasks = tasksForQuadrant(reordered, "do");

  assert.deepEqual(doTasks.map((task) => task.id), ["task-3", "task-1", "task-2"]);
  assert.deepEqual(doTasks.map((task) => task.order), [0, 1, 2]);
  assert.equal(reordered.tasks.find((task) => task.id === "task-4").order, 0);
});

test("reordering can append a task and rejects a target from another group", () => {
  let state = createEmptyState();
  for (const [index, title] of ["First", "Second", "Third"].entries()) {
    state = addTask(
      state,
      { title, important: true, urgent: true },
      { now: index + 1, idFactory: () => `task-${index + 1}` },
    ).state;
  }
  state = addTask(
    state,
    { title: "Other quadrant", important: false, urgent: true },
    { now: 4, idFactory: () => "task-4" },
  ).state;

  const appended = reorderTask(state, "task-1", null, 500);
  assert.deepEqual(
    tasksForQuadrant(appended, "do").map((task) => task.id),
    ["task-2", "task-3", "task-1"],
  );
  assert.equal(reorderTask(state, "task-1", "task-4"), state);

  const withCompletedTask = setTaskCompleted(state, "task-2", true, 600);
  assert.equal(
    reorderTask(withCompletedTask, "task-2", "task-1"),
    withCompletedTask,
  );
});

test("editing, completing, deleting, and restoring preserve task identity", () => {
  const created = addTask(
    createEmptyState(),
    { title: "First title", important: true, urgent: true },
    fixedOptions,
  ).state;
  const edited = editTaskTitle(created, "task-1", "Better title", 200);
  const completed = setTaskCompleted(edited, "task-1", true, 300);
  const deletion = deleteTask(completed, "task-1");
  const restored = restoreDeletedTask(deletion.state, deletion.deleted);

  assert.equal(restored.tasks[0].id, "task-1");
  assert.equal(restored.tasks[0].title, "Better title");
  assert.equal(restored.tasks[0].completed, true);
});

test("normalization keeps valid tasks and drops duplicates or malformed records", () => {
  const candidate = {
    revision: 4,
    updatedAt: 900,
    tasks: [
      {
        id: "valid",
        title: " Keep me ",
        important: true,
        urgent: false,
        completed: false,
        order: 2,
      },
      { id: "valid", title: "Duplicate", important: false, urgent: false },
      { id: "bad", title: "", important: true, urgent: true },
    ],
  };

  const normalized = normalizeState(candidate);
  assert.equal(normalized.droppedCount, 2);
  assert.equal(normalized.state.tasks.length, 1);
  assert.equal(normalized.state.tasks[0].title, "Keep me");
  assert.equal(normalized.state.revision, 4);
});
