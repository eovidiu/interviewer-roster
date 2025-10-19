import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "@/App";

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("App router smoke tests", () => {
  it("shows dashboard KPIs with seeded data", async () => {
    renderAt("/");

    expect(
      await screen.findByRole("heading", { name: /Dashboard/i })
    ).toBeInTheDocument();

    expect(await screen.findByText(/No-Show Rate/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/sarah\.chen@company\.com/i)
    ).toBeInTheDocument();
  });

  it("lists seeded interviewers on roster page", async () => {
    renderAt("/interviewers");
    await waitFor(() => {
      expect(document.querySelector("h1")?.textContent).toMatch(
        /Interviewers/i
      );
    });

    expect(await screen.findByText(/Sarah Chen/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/priya\.patel@company\.com/i)
    ).toBeInTheDocument();
  });

  it("lists seeded interview events on events page", async () => {
    renderAt("/events");
    await waitFor(() => {
      expect(document.querySelector("h1")?.textContent).toMatch(
        /Interview Events/i
      );
    });

    const eventEmailMatches = await screen.findAllByText(
      /sarah\.chen@company\.com/i
    );
    expect(
      eventEmailMatches.some(
        (element) => element.closest("table") !== null
      )
    ).toBe(true);
    expect(await screen.findByText(/Machine Learning/i)).toBeInTheDocument();
  });
});
