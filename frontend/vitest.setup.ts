import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Precomputed fixtures (no logic here, just snapshots)
const initial = {
  id: "TEST-1",
  board: [null,null,null,null,null,null,null,null,null],
  winner: null,
  is_draw: false,
  status: "in progress",
};

// Sequence used by your test: 0, 3, 1, 4, 2 → X wins
const script = [
  // after X plays 0
  {
    board: ["X",null,null, null,null,null, null,null,null],
    winner: null,
    is_draw: false,
    status: "in progress",
  },
  // after O plays 3
  {
    board: ["X",null,null, "O",null,null, null,null,null],
    winner: null,
    is_draw: false,
    status: "in progress",
  },
  // after X plays 1
  {
    board: ["X","X",null, "O",null,null, null,null,null],
    winner: null,
    is_draw: false,
    status: "in progress",
  },
  // after O plays 4
  {
    board: ["X","X",null, "O","O",null, null,null,null],
    winner: null,
    is_draw: false,
    status: "in progress",
  },
  // after X plays 2 → win
  {
    board: ["X","X","X", "O","O",null, null,null,null],
    winner: "X",
    is_draw: false,
    status: "X wins",
  },
];

const dashGameId = "TEST-DASH";
const dashState = {
  id: dashGameId,
  board: [null, null, null, null, null, null, null, null, null],
  winner: null,
  is_draw: false,
  status: "in progress",
};

let step = -1;

export const server = setupServer(
  // Create game
  http.post("http://localhost:8000/tictactoe/new", async () => {
    step = -1;
    return HttpResponse.json(initial);
  }),

  // Make move
  http.post("http://localhost:8000/tictactoe/:id/move", async ({ request, params }) => {
    const { id } = params;
    const body = await request.json();
    const { index, player } = body as { index: number; player: "X" | "O" | "-" };
  

  
    // ✅ Finished mini shortcut (for App test free-choice)
    if (id === "TEST-DASH" && index === 4 && player === "O") {
      return HttpResponse.json({
        id,
        board: Array(9).fill("O"),  // simulate full finished mini
        winner: "O",
        is_draw: false,
        status: "won",
      });
    }
    
  
    step += 1;
    const s = script[Math.min(step, script.length - 1)];
    return HttpResponse.json({ id, ...s });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
