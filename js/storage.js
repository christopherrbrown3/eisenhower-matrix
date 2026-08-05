import { createEmptyState, normalizeState, SCHEMA_VERSION } from "./model.js";

export const STORAGE_KEY = `eisenhower-matrix:v${SCHEMA_VERSION}`;
const RECOVERY_PREFIX = `${STORAGE_KEY}:recovery`;

export function getLocalStorage(windowObject = globalThis.window) {
  try {
    const storage = windowObject?.localStorage;
    if (!storage) throw new Error("Local storage is unavailable.");
    const probeKey = `${STORAGE_KEY}:probe`;
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
    return { storage, error: null };
  } catch (error) {
    return { storage: null, error };
  }
}

function preserveRecoveryCopy(storage, rawValue, now, { resetOriginal = true } = {}) {
  try {
    storage.setItem(`${RECOVERY_PREFIX}:${now}`, rawValue);
    if (resetOriginal) storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function readState(storage, now = Date.now()) {
  if (!storage) {
    return {
      state: createEmptyState(),
      issue: "Tasks will work for this visit, but this browser is blocking local storage.",
    };
  }

  let rawValue;
  try {
    rawValue = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      state: createEmptyState(),
      issue: "Saved tasks could not be read. New changes may not survive a reload.",
    };
  }

  if (rawValue === null) return { state: createEmptyState(), issue: null };

  try {
    const normalized = normalizeState(JSON.parse(rawValue));
    if (normalized.droppedCount > 0) {
      const preserved = preserveRecoveryCopy(storage, rawValue, now, { resetOriginal: false });
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(normalized.state));
      } catch {
        // The valid tasks still remain available in memory for this visit.
      }
      return {
        state: normalized.state,
        issue: `${normalized.droppedCount} unreadable task${normalized.droppedCount === 1 ? " was" : "s were"} left out.${preserved ? " A recovery copy was kept in this browser." : ""}`,
      };
    }
    return { state: normalized.state, issue: null };
  } catch {
    const preserved = preserveRecoveryCopy(storage, rawValue, now);
    return {
      state: createEmptyState(),
      issue: preserved
        ? "Saved tasks were unreadable, so the matrix was reset and a recovery copy was kept in this browser."
        : "Saved tasks were unreadable and could not be recovered. The matrix was reset.",
    };
  }
}

export function writeState(storage, state, now = Date.now()) {
  const nextState = {
    ...state,
    version: SCHEMA_VERSION,
    revision: state.revision + 1,
    updatedAt: now,
  };

  if (!storage) {
    return {
      state: nextState,
      error: new Error("Local storage is unavailable."),
    };
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return { state: nextState, error: null };
  } catch (error) {
    return { state: nextState, error };
  }
}

export function parseExternalState(rawValue) {
  if (typeof rawValue !== "string") return null;
  try {
    return normalizeState(JSON.parse(rawValue)).state;
  } catch {
    return null;
  }
}
