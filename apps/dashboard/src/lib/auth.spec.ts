// @vitest-environment happy-dom

import { Window } from "happy-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { buildBasicAuthHeader, clearAuth, readAuth, writeAuth, type StoredAuth } from "./auth";

const auth: StoredAuth = {
  serverUrl: "http://localhost:3001",
  username: "admin",
  password: "change-me-admin"
};

describe("auth helpers", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: new Window()
    });

    window.localStorage.clear();
  });

  it("builds a basic auth header from stored credentials", () => {
    expect(buildBasicAuthHeader(auth)).toBe("Basic YWRtaW46Y2hhbmdlLW1lLWFkbWlu");
  });

  it("persists auth in localStorage and reads it back", () => {
    writeAuth(auth);

    expect(readAuth()).toEqual(auth);
  });

  it("returns null when stored auth is malformed", () => {
    window.localStorage.setItem("bot-farm-admin-auth", "{");

    expect(readAuth()).toBeNull();
  });

  it("clears stored auth", () => {
    writeAuth(auth);

    clearAuth();

    expect(readAuth()).toBeNull();
  });
});
