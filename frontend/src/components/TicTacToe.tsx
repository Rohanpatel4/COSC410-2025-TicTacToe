import React from "react";

type Player = "X" | "O" ;
type Cell = Player | null;

type Props = {
  onWin?: (winner: Player | "draw" | null) => void;
  getPlayer?: () => Player;        // ask parent whose turn it is
  onPlayed?: (p: Player) => void;
  boardId?: number; // 0..8 for mini boards
  onCell?: (e: {
    boardId: number;
    gameId: string;
    cellIndex: number;
    player: Player;
    stillPlaying: boolean;
  }) => void;
  boardDisabled?: boolean; // ← NEW: when true, this whole board can't be played
};

// ----- Backend DTOs -----
type GameStateDTO = {
  id: string;
  board: Cell[];
  winner: Player | null;
  is_draw: boolean;
  status: string;
};

// Prefer env, fallback to localhost:8000
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";



  export default function TicTacToe({ onWin, getPlayer, onPlayed, boardId, onCell, boardDisabled}: Props) {
  const [state, setState] = React.useState<GameStateDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Create a new game on mount
  React.useEffect(() => {
    let canceled = false;
    async function start() {
      setError(null);
      setLoading(true);
      try {
        const gs = await createGame();
        if (!canceled) setState(gs);
      } catch (e: any) {
        if (!canceled) setError(e?.message ?? "Failed to start game");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    start();
    return () => {
      canceled = true;
    };
  }, []);

  // Notify parent when result changes
  React.useEffect(() => {
    if (!state || !onWin) return;
    if (state.winner) onWin(state.winner);
    else if (state.is_draw) onWin("draw");
  }, [state?.winner, state?.is_draw]);

  async function createGame(): Promise<GameStateDTO> {
    const r = await fetch(`${API_BASE}/tictactoe/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!r.ok) throw new Error(`Create failed: ${r.status}`);
    return r.json();
  }

  async function playMove(index: number, player: Player): Promise<GameStateDTO> {
    if (!state) throw new Error("No game");
    const r = await fetch(`${API_BASE}/tictactoe/${state.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, player }),   
    });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Move failed: ${r.status}`);
    }
    return r.json();
  }

  async function handleClick(i: number) {
    if (!state || loading || boardDisabled) return; // ← NEW
    // Light client-side guard to avoid noisy 400s:
    if (state.winner || state.is_draw || state.board[i] !== null) return;

    setLoading(true);
    setError(null);
    try {
      const p: Player = getPlayer ? getPlayer() : "X"; 
      const next = await playMove(i, p);               
      setState(next);
      onPlayed?.(p);
      if (onCell && boardId !== undefined) {
             onCell({
               boardId,
               gameId: next.id,
               cellIndex: i,
               player: p,
               stillPlaying: !next.winner && !next.is_draw,
             });
           }
    } catch (e: any) {
      setError(e?.message ?? "Move failed");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="mb-2 text-red-600 font-semibold">Error: {error}</div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <div className="text-center">Loading…</div>
      </div>
    );
  }

  const { board, status } = state;

  return (
    <div className="max-w-sm mx-auto p-4"> 
      <div className="grid grid-cols-3 gap-2">
        {board.map((c, i) => (
          <button
            key={i}
            className="aspect-square rounded-2xl text-3xl font-bold flex items-center justify-center disabled:opacity-50"
            onClick={() => handleClick(i)}
            aria-label={`cell-${i}`}
            disabled={loading || c !== null || boardDisabled || state.winner !== null || state.is_draw}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}