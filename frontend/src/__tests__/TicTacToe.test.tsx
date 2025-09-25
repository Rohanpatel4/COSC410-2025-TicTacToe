import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TicTacToe from "../components/TicTacToe";


describe("TicTacToe component (API via MSW)", () => {
  function makeTurnProvider() {
    const seq: Array<"X" | "O"> = ["X", "O", "X", "O", "X"];
    let i = 0;
    return {
      getPlayer: () => seq[Math.min(i, seq.length - 1)],
      onPlayed: () => { i += 1; },
    };
  }
  it("plays a simple game and declares winner", async () => {
    const onWin = vi.fn();
    const turns = makeTurnProvider();
    render(
      <TicTacToe
        onWin={onWin}
        getPlayer={turns.getPlayer}
        onPlayed={turns.onPlayed}
      />
    );

    // Wait for game creation (MSW handles POST /tictactoe/new)
    await screen.findByLabelText("cell-0");

  fireEvent.click(screen.getByLabelText("cell-0"));
  expect(await screen.findByLabelText("cell-0")).toHaveTextContent("X");

  fireEvent.click(screen.getByLabelText("cell-3"));
  expect(await screen.findByLabelText("cell-3")).toHaveTextContent("O");

  fireEvent.click(screen.getByLabelText("cell-1"));
  expect(await screen.findByLabelText("cell-1")).toHaveTextContent("X");

  fireEvent.click(screen.getByLabelText("cell-4"));
  expect(await screen.findByLabelText("cell-4")).toHaveTextContent("O");

  fireEvent.click(screen.getByLabelText("cell-2"));
  expect(await screen.findByLabelText("cell-2")).toHaveTextContent("X");

  expect(onWin).toHaveBeenCalledWith("X");
});

  it("prevents moves in occupied cells", async () => {
  const turns = makeTurnProvider();
  render(<TicTacToe getPlayer={turns.getPlayer} onPlayed={turns.onPlayed} />);
  const c0 = await screen.findByLabelText("cell-0");

  fireEvent.click(c0);
  expect(await screen.findByLabelText("cell-0")).toHaveTextContent("X");

  fireEvent.click(c0); 
  expect(c0.textContent).toBe("X");
  });
});

