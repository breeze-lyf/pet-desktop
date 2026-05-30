import { beforeEach, describe, expect, it } from "vitest";
import { readJson, writeJson } from "./storage";

describe("storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns fallback when a key is missing", () => {
    expect(readJson("missing", { value: 1 })).toEqual({ value: 1 });
  });

  it("round-trips JSON values", () => {
    writeJson("pet", { name: "Momo" });
    expect(readJson("pet", { name: "" })).toEqual({ name: "Momo" });
  });

  it("uses fallback for malformed JSON", () => {
    localStorage.setItem("broken", "{");
    expect(readJson("broken", { ok: true })).toEqual({ ok: true });
  });
});
