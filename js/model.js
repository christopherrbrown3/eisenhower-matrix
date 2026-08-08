export const SCHEMA_VERSION = 1;
export const MAX_TITLE_LENGTH = 160;

export const QUADRANTS = Object.freeze({
  do: Object.freeze({
    id: "do",
    label: "Do now",
    important: true,
    urgent: true,
  }),
  schedule: Object.freeze({
    id: "schedule",
    label: "Schedule",
    important: true,
    urgent: false,
  }),
  delegate: Object.freeze({
    id: "delegate",
    label: "Delegate",
    important: false,
    urgent: true,
  }),
  eliminate: Object.freeze({
    id: "eliminate",
    label: "Eliminate",
    important: false,
    urgent: false,
  }),
});

export const QUADRANT_IDS = Object.freeze(Object.keys(QUADRANTS));

export function cleanTitle(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/gu, " ")
    .slice(0, MAX_TITLE_LENGTH);
}

export function quadrantFor({ important, urgent }) {
  if (important === true && urgent === true) return "do";
  if (important === true && urgent === false) return "schedule";
  if (important === false && urgent === true) return "delegate";
  if (important === false && urgent === false) return "eliminate";
  return null;
}

export function signalsForQuadrant(quadrantId) {
  const quadrant = QUADRANTS[quadrantId];
  if (!quadrant) throw new TypeError(`Unknown quadrant: ${quadrantId}`);
  return { important: quadrant.important, urgent: quadrant.urgent };
}

export function createEmptyState() {
  return {
    version: SCHEMA_VERSION,
    revision: 0,
    updatedAt: 0,
    tasks: [],
  };
}

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nextOrder(tasks, quadrantId) {
  const values = tasks
    .filter((task) => quadrantFor(task) === quadrantId)
    .map((task) => task.order)
    .filter(Number.isFinite);
  return values.length ? Math.max(...values) + 1 : 0;
}

export function createTask(
  { title, important, urgent },
  tasks = [],
  { now = Date.now(), idFactory = defaultIdFactory } = {},
) {
  const normalizedTitle = cleanTitle(title);
  const quadrantId = quadrantFor({ important, urgent });

  if (!normalizedTitle) throw new TypeError("Task title is required.");
  if (!quadrantId) throw new TypeError("Importance and urgency are required.");

  return {
    id: idFactory(),
    title: normalizedTitle,
    important,
    urgent,
    completed: false,
    order: nextOrder(tasks, quadrantId),
    createdAt: now,
    updatedAt: now,
  };
}

export function addTask(state, input, options) {
  const task = createTask(input, state.tasks, options);
  return {
    state: { ...state, tasks: [...state.tasks, task] },
    task,
  };
}

export function editTaskTitle(state, taskId, title, now = Date.now()) {
  const normalizedTitle = cleanTitle(title);
  if (!normalizedTitle) throw new TypeError("Task title is required.");

  let changed = false;
  const tasks = state.tasks.map((task) => {
    if (task.id !== taskId || task.title === normalizedTitle) return task;
    changed = true;
    return { ...task, title: normalizedTitle, updatedAt: now };
  });

  return changed ? { ...state, tasks } : state;
}

export function setTaskCompleted(state, taskId, completed, now = Date.now()) {
  let changed = false;
  const tasks = state.tasks.map((task) => {
    if (task.id !== taskId || task.completed === completed) return task;
    changed = true;
    return { ...task, completed, updatedAt: now };
  });
  return changed ? { ...state, tasks } : state;
}

export function moveTask(state, taskId, quadrantId, now = Date.now()) {
  const signals = signalsForQuadrant(quadrantId);
  let changed = false;
  const order = nextOrder(
    state.tasks.filter((task) => task.id !== taskId),
    quadrantId,
  );

  const tasks = state.tasks.map((task) => {
    if (task.id !== taskId) return task;
    if (task.important === signals.important && task.urgent === signals.urgent) return task;
    changed = true;
    return { ...task, ...signals, order, updatedAt: now };
  });

  return changed ? { ...state, tasks } : state;
}

export function reorderTask(state, taskId, beforeTaskId = null, now = Date.now()) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return state;

  const quadrantId = quadrantFor(task);
  const peers = state.tasks
    .filter(
      (item) =>
        quadrantFor(item) === quadrantId && item.completed === task.completed,
    )
    .sort((a, b) => a.order - b.order);
  const reordered = peers.filter((item) => item.id !== taskId);

  if (beforeTaskId === null) {
    reordered.push(task);
  } else {
    const targetIndex = reordered.findIndex((item) => item.id === beforeTaskId);
    if (targetIndex < 0) return state;
    reordered.splice(targetIndex, 0, task);
  }

  if (reordered.every((item, index) => item.id === peers[index]?.id)) return state;

  const orderById = new Map(reordered.map((item, index) => [item.id, index]));
  const tasks = state.tasks.map((item) => {
    const order = orderById.get(item.id);
    if (order === undefined || item.order === order) return item;
    return { ...item, order, updatedAt: now };
  });

  return { ...state, tasks };
}

export function deleteTask(state, taskId) {
  const index = state.tasks.findIndex((task) => task.id === taskId);
  if (index < 0) return { state, deleted: null };
  const deleted = state.tasks[index];
  return {
    state: { ...state, tasks: state.tasks.filter((task) => task.id !== taskId) },
    deleted: { task: deleted, index },
  };
}

export function restoreDeletedTask(state, deleted) {
  if (!deleted?.task || state.tasks.some((task) => task.id === deleted.task.id)) return state;
  const tasks = [...state.tasks];
  const index = Math.max(0, Math.min(deleted.index, tasks.length));
  tasks.splice(index, 0, deleted.task);
  return { ...state, tasks };
}

export function tasksForQuadrant(state, quadrantId, showCompleted = false) {
  return state.tasks
    .filter((task) => quadrantFor(task) === quadrantId)
    .filter((task) => showCompleted || !task.completed)
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.order - b.order);
}

export function normalizeState(candidate) {
  if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.tasks)) {
    throw new TypeError("Saved task data has an invalid shape.");
  }

  const seenIds = new Set();
  let droppedCount = 0;
  const tasks = [];

  for (const [index, value] of candidate.tasks.entries()) {
    const title = cleanTitle(value?.title);
    const id = typeof value?.id === "string" ? value.id.trim() : "";
    const validSignals =
      typeof value?.important === "boolean" && typeof value?.urgent === "boolean";

    if (!id || seenIds.has(id) || !title || !validSignals) {
      droppedCount += 1;
      continue;
    }

    seenIds.add(id);
    tasks.push({
      id,
      title,
      important: value.important,
      urgent: value.urgent,
      completed: value.completed === true,
      order: Number.isFinite(value.order) ? value.order : index,
      createdAt: Number.isFinite(value.createdAt) ? value.createdAt : 0,
      updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : 0,
    });
  }

  return {
    state: {
      version: SCHEMA_VERSION,
      revision: Number.isInteger(candidate.revision) ? candidate.revision : 0,
      updatedAt: Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : 0,
      tasks,
    },
    droppedCount,
  };
}
