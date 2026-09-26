import assert from "node:assert/strict";
import test from "node:test";
import { createBrowserIdentity, getBrowserIdentity, newReactionIntent } from "./newsReactions";

test("browser identity persists when storage is available", () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const first = createBrowserIdentity(storage, () => "00000000-0000-4000-8000-000000000001");
  const second = createBrowserIdentity(storage, () => "00000000-0000-4000-8000-000000000002");
  assert.equal(first.browserId, second.browserId);
  assert.equal(first.persistent, true);
});

test("storage denial falls back to a pseudonymous session id", () => {
  const denied = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
  const result = createBrowserIdentity(denied, () => "00000000-0000-4000-8000-000000000003");
  assert.equal(result.persistent, false);
  assert.match(result.browserId, /^br_/);
});

test("localStorage getter denial cannot escape browser identity fallback", () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: Object.defineProperty({}, "localStorage", { get: () => { throw new Error("SecurityError"); } }),
  });
  try {
    const result = getBrowserIdentity();
    assert.equal(result.persistent, false);
    assert.match(result.browserId, /^br_/);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("intent toggles selected reaction into remove operation", () => {
  const intent = newReactionIntent(
    { browserId: "br_12345678", newsId: "news_12345678", contentVersion: "cv_12345678" },
    null,
    2,
    () => "00000000-0000-4000-8000-000000000004",
  );
  assert.equal(intent.operation, "remove");
  assert.equal(intent.expectedRevision, 2);
});
