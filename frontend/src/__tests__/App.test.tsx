import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

describe("App integration", () => {
  it("can start a new game after finishing", async () => {
    render(<App />);

    // first mini-board's top-left cell
    const c0 = (await screen.findAllByLabelText("cell-0"))[0];

    // play one move -> App header flips to O's turn
    fireEvent.click(c0);
    await screen.findByText(/O's turn/i);

    // New Game resets
    const newGameBtn = screen.getByRole("button", { name: /new game/i });
    fireEvent.click(newGameBtn);

    await screen.findByText(/X's turn/i);
    const c0After = (await screen.findAllByLabelText("cell-0"))[0];
    expect(c0After.textContent).toBe("");
  });
  it("sets the active mini to the cell index you played (routes to correct board)", async () => {
    render(<App />);

    // First move: click mini 0, cell 4 → next active mini should be #4
    const cell4All = await screen.findAllByLabelText("cell-4");
    fireEvent.click(cell4All[0]);
    await screen.findByText(/O's turn/i);

    // Mini 4 should be enabled; mini 3 should be disabled
    const cell0All = await screen.findAllByLabelText("cell-0");
    const mini3c0 = cell0All[3] as HTMLButtonElement;
    const mini4c0 = cell0All[4] as HTMLButtonElement;

    expect(mini3c0.disabled).toBe(true);
    expect(mini4c0.disabled).toBe(false);
  });

  it("prevents playing on non-active minis while a target mini is active", async () => {
    render(<App />);

    // Make mini 4 the active target (from mini 0, cell 4)
    const cell4All = await screen.findAllByLabelText("cell-4");
    fireEvent.click(cell4All[0]);
    await screen.findByText(/O's turn/i);

    // Try clicking disabled mini (3) → should not change header
    const cell0All = await screen.findAllByLabelText("cell-0");
    const mini3c0 = cell0All[3] as HTMLButtonElement;
    expect(mini3c0.disabled).toBe(true);

    fireEvent.click(mini3c0);
    expect(await screen.findByText(/O's turn/i)).toBeInTheDocument();
  });
});

