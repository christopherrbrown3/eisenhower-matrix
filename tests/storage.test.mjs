import test from "node:test";
import assert from "node:assert/strict";

import { addTask, createEmptyState } from "../js/model.js";
import {
  getLocalStorage,
  parseExternalState,
  readState,
  STORAGE_KEY,
  writeState,
} from "../js/storage.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

test("detects usable and blocked local storage", () => {
  const memory = new MemoryStorage();
  assert.equal(getLocalStorage({ localStorage: memory }).storage, memory);
  assert.ok(
    getLocalStorage({
      get localStorage() {
        throw new Error("blocked");
      },
    }).error,
  );
});

test("reads an empty state when nothing has been stored", () => {
  const result = readState(new MemoryStorage(), 100);
  assert.deepEqual(result.state, createEmptyState());
  assert.equal(result.issue, null);
});

test("writes and reads a versioned state", () => {
  const storage = new MemoryStorage();
  const created = addTask(
    createEmptyState(),
    { title: "Plan strategy", important: true, urgent: false },
    { now: 100, idFactory: () => "task-1" },
  ).state;
  const written = writeState(storage, created, 200);
  const read = readState(storage, 300);

  assert.equal(written.error, null);
  assert.equal(written.state.revision, 1);
  assert.equal(read.state.tasks[0].title, "Plan strategy");
  assert.equal(read.state.updatedAt, 200);
});

test("backs up corrupt data before resetting the matrix", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, "not-json");
  const result = readState(storage, 1234);

  assert.equal(result.state.tasks.length, 0);
  assert.match(result.issue, /recovery copy/);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem(`${STORAGE_KEY}:recovery:1234`), "not-json");
});

test("keeps valid tasks when one stored task is unreadable", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      revision: 2,
      tasks: [
        { id: "valid", title: "Keep", important: true, urgent: true },
        { id: "invalid", title: "Missing signals" },
      ],
    }),
  );

  const result = readState(storage, 4321);
  assert.equal(result.state.tasks.length, 1);
  assert.match(result.issue, /1 unreadable task/);
  assert.ok(storage.getItem(STORAGE_KEY));
  assert.ok(storage.getItem(`${STORAGE_KEY}:recovery:4321`));
});

test("rejects malformed external storage events", () => {
  assert.equal(parseExternalState("not-json"), null);
  assert.equal(parseExternalState(null), null);
});
