import "@testing-library/jest-dom/vitest";
import { afterEach, afterAll, beforeAll, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { db } from "@/polymet/data/database-service";
import { server } from "@/mocks/server";

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

// Mock hasPointerCapture and scrollIntoView for Radix UI compatibility
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || vi.fn().mockReturnValue(false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || vi.fn();
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || vi.fn();
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || vi.fn();
}

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  // Skip database reset when using API (API backend manages its own state)
  // Only reset if using localStorage-based database service
  if (typeof db.resetDatabase === 'function') {
    try {
      await db.resetDatabase();
    } catch (error) {
      // Ignore reset errors when using API service
      if (!error.message?.includes('not supported via API')) {
        throw error;
      }
    }
  }
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
  server.resetHandlers();
  cleanup();
});

// Clean up MSW server after all tests
afterAll(() => {
  server.close();
});
