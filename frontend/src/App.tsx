import TicTacToe from "@/components/TicTacToe";
import React from "react";
import "./App.css";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

type MiniPlayer = "X" | "O"; 
type BigPlayer  = "X" | "O" | "-";

type BigDTO = { winner: "X" | "O" | null; is_draw: boolean };
type MoveEvent = {
  boardId: number;        // 0..8 (which mini board)
  gameId: string;         // backend game id of that mini board
  cellIndex: number;      // 0..8 (which cell inside that board)
  player: MiniPlayer;         // "X" or "O"
  stillPlaying: boolean;  // true if not won/draw after the move
};

export default function App() {
  
  const [nextPlayer, setNextPlayer] = React.useState<MiniPlayer>("X");
  const [activeBoard, setActiveBoard] = React.useState<number | null>(null);
  const [finished, setFinished] = React.useState<Set<number>>(new Set());
  const [winners, setWinners] = React.useState<Record<number, MiniPlayer | "draw" | undefined>>({});
  const [resetSeed, setResetSeed] = React.useState(0);
  const [bigResult, setBigResult] = React.useState<"X" | "O" | "draw" | null>(null);
  const [bigGameId, setBigGameId] = React.useState<string | null>(null);
    
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/tictactoe/new`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!r.ok) throw new Error(`Create failed: ${r.status}`);
        const gs = await r.json();
        if (!cancelled) setBigGameId(gs.id);
      } catch (e) {
        console.error("Big game init failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Report a finished mini-board to the big game
  async function reportMiniResult(miniIndex: number, winner: BigPlayer | "draw") {
    if (!bigGameId) return null;
    const p: BigPlayer = winner === "draw" ? "-" : (winner as MiniPlayer);
    try {
      const r = await fetch(`${API_BASE}/tictactoe/${bigGameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: miniIndex, player: p }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.detail ?? `Big move failed: ${r.status}`);
      }
      const next: BigDTO = await r.json();
      if (next.winner) setBigResult(next.winner);
      else if (next.is_draw) setBigResult("draw");
      return next;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  async function createBigGame() {
    try {
      const r = await fetch(`${API_BASE}/tictactoe/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!r.ok) throw new Error(`Create failed: ${r.status}`);
      const gs = await r.json();
      setBigGameId(gs.id);
    } catch (e) {
      console.error("Big game init failed", e);
      setBigGameId(null);
    }
  }
  const newGame = () => {
    setResetSeed((s) => s + 1);
    setNextPlayer("X");
    setActiveBoard(null);
    setFinished(new Set());
    setWinners({});
    setBigResult(null);
    createBigGame(); // ← ensure a fresh big game id
  };

  const getPlayer: () => MiniPlayer = () => nextPlayer;
  const handlePlayed = (p: MiniPlayer) => setNextPlayer(p === "X" ? "O" : "X");
  const handleMiniCell = (e: MoveEvent) => {
    setFinished(prev => {
      const next = new Set(prev);
  
      // if that mini just ended (win or draw), mark it finished
      if (!e.stillPlaying) next.add(e.boardId);
  
      // next active mini is where the last move landed,
      // unless that target mini is already finished → free choice (null)
      const nextTarget = e.cellIndex;
      setActiveBoard(next.has(nextTarget) ? null : nextTarget);
  
      return next;
    });
  };
  const handleMiniWin = (i: number) => (w: MiniPlayer | "draw" | null) => {
    if (!w) return;
  
    // record who took that mini board (X | O | "draw")
    setWinners(prev => ({ ...prev, [i]: w }));
  
    // report to backend big game and possibly end the match
    reportMiniResult(i, w);
  };
  const headerText =
    bigResult === "draw"
      ? "Draw"
      : bigResult === "X"
      ? "X wins"
      : bigResult === "O"
      ? "O wins"
      : `${nextPlayer}'s turn`;
    
  


  // App will perfore a game on its own where it will track
  // the TicTacToe will not change that much
  // In AI be specific
  // pnpm install dev when making a change to the test
  // pnpm test


  return (
    <div className="app">
      <div className="statusBar">{headerText}</div>
      <div className="outer">
        {/* 9 mini boards */}
        <div className="inner">
          {Array.from({ length: 9 }).map((_, i) => {
            const effectiveActive =
              activeBoard !== null && finished.has(activeBoard) ? null : activeBoard;
            const disabled =
              bigResult !== null ||              // 🔒 disable if big game is over
              (effectiveActive !== null && i !== effectiveActive);

            const row = Math.floor(i / 3);   // 0,1,2
            const col = i % 3; 
            const winner = winners[i];


            return (
              <div 
              key={i}
              className={`cell cell--r${row} cell--c${col} ${
                finished.has(i) ? "cell--finished" : ""
              } ${disabled ? "cell--disabled" : "cell--active"} ${
                winner ? "cell--won" : ""
              }`}
            >{winner ? (
              <div className="miniWinner" aria-label={`mini-winner-${i}`}>
                {winner === "draw" ? "–" : winner}
              </div>
            ) : (
                <TicTacToe
                  key={`mini-${i}-${resetSeed}`}
                  boardId={i}
                  getPlayer={getPlayer}
                  onPlayed={handlePlayed}
                  onCell={handleMiniCell}
                  boardDisabled={disabled}
                  onWin={handleMiniWin(i)}
                />
            )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="controls controlsBottom">
        <button className="rounded-2xl px-4 py-2 border" onClick={newGame}>
          New Game
        </button>
      </div>
  </div>
  );
}
