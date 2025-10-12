import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { db } from "@/polymet/data/database-service";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  await db.resetDatabase();
  localStorage.setItem(
    "auth_user",
    JSON.stringify({
      name: "Smoke Test Admin",
      email: "smoke.admin@example.com",
      picture: "https://example.com/avatar.png",
      role: "admin",
    })
  );
});

afterEach(() => {
  cleanup();
});
