import TicTacToe from "@/components/TicTacToe";
import React from "react";
import "./App.css";

type Player = "X" | "O" | "-";

type MoveEvent = {
  boardId: number;        // 0..8 (which mini board)
  gameId: string;         // backend game id of that mini board
  cellIndex: number;      // 0..8 (which cell inside that board)
  player: Player;         // "X" or "O"
  stillPlaying: boolean;  // true if not won/draw after the move
};

export default function App() {
  
  const [nextPlayer, setNextPlayer] = React.useState<Player>("X");
  const [activeBoard, setActiveBoard] = React.useState<number | null>(null);
  const [finished, setFinished] = React.useState<Set<number>>(new Set());
  const [winners, setWinners] = React.useState<Record<number, Player | "draw" | undefined>>({});
  const [resetSeed, setResetSeed] = React.useState(0);
  const [bigResult, setBigResult] = React.useState<"X" | "O" | "draw" | null>(null);
  const [bigTrigger, setBigTrigger] = React.useState(0);
  const [bigMove, setBigMove] = React.useState<{index:number; player:Player; trigger:number}>();
    
  
  const newGame = () => {
    // Force all 10 boards to remount (each board calls /new on mount)
    setResetSeed((s) => s + 1);
    // Reset meta state
    setNextPlayer("X");
    setActiveBoard(null);
    setFinished(new Set());
    setWinners({});
    setBigResult(null);
    setBigMove(undefined);
    setBigTrigger(0); 
  };

  const getPlayer = () => nextPlayer;
  const handlePlayed = (p: Player) => setNextPlayer(p === "X" ? "O" : "X");
  const handleMiniCell = (e: MoveEvent) => {
    setFinished(prev => {
      const next = new Set(prev);
      if (!e.stillPlaying) {
        next.add(e.boardId); // the mini board just ended (win or draw)
      }
  
      const nextTarget = e.cellIndex; // where the last move points to
      setActiveBoard(next.has(nextTarget) ? null : nextTarget); // null = free choice
  
      return next;
    });
  };
  const handleMiniWin = (i: number) => (w: Player | "draw" | null) => {
    if (!w) return;
  
    // record who took that mini board (X | O | "draw")
    setWinners(prev => ({ ...prev, [i]: w }));

    const t = bigTrigger + 1;
    setBigTrigger(t);
  
    if (w === "X" || w === "O") {
      setBigMove({ index: i, player: w, trigger: t });
    } else if (w === "draw") {
      // send "-" to the big board/back end to mark the cell as taken but unwinnable
      setBigMove({ index: i, player: "-", trigger: t });
    }
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
        {/* Big board (visible header/button; not clickable) */}
        <div className="big">
          <div className="bigScale">
            <TicTacToe
              key={`big-${resetSeed}`}
              onWin={(w) => {
                if (w === "-") return;  // optional safety no-op
                setBigResult(w);        // "X" | "O" | "draw" | null
              }}
              boardDisabled={true}             // ← disable clicking on the big board
              externalMove={bigMove}
            />
          </div>
        </div>

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
