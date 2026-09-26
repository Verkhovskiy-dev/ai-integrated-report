import assert from "node:assert/strict";
import test from "node:test";
import { buildNewsIdentity, canonicalSource } from "./newsIdentity";

test("news id follows canonical source while content version follows content", () => {
  const first = buildNewsIdentity({ title: "Title", description: "One", sources: ["https://EXAMPLE.com/a?utm_source=x"] });
  const changed = buildNewsIdentity({ title: "Updated title", description: "Two", sources: ["https://example.com/a"] });
  assert.equal(first.newsId, changed.newsId);
  assert.notEqual(first.contentVersion, changed.contentVersion);
});

test("tracking parameters do not create a second news id", () => {
  assert.equal(canonicalSource("https://example.com/a?utm_medium=social&x=1"), "https://example.com/a?x=1");
});
