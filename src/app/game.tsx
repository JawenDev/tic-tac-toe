"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { play, setMuted } from "../utils/sound";
import {
  DEFAULT_THEME,
  Mark,
  THEMES,
  isThemeId,
  type PlayerId,
  type ThemeId,
} from "./themes";

type Cell = PlayerId | null;
type Board = readonly Cell[];
interface Scores {
  p1: number;
  p2: number;
  draws: number;
}

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

const EMPTY_BOARD: Board = Array<Cell>(9).fill(null);
const ZERO_SCORES: Scores = { p1: 0, p2: 0, draws: 0 };
const STORAGE_KEY = "tic-tac-toe:v1";

function findWin(board: Board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { winner: v, winningLine: line as readonly number[] };
    }
  }
  return { winner: null, winningLine: null };
}

const other = (p: PlayerId): PlayerId => (p === "p1" ? "p2" : "p1");

const PRESS =
  "touch-manipulation select-none transition-all hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 dark:focus-visible:ring-amber-300 dark:focus-visible:ring-offset-zinc-900";
const SHADOW =
  "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(244,244,245,0.9)]";

export default function Game() {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [scores, setScores] = useState<Scores>(ZERO_SCORES);
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);
  const [muted, setMutedState] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [starter, setStarter] = useState<PlayerId>("p1");
  const [mounted, setMounted] = useState(false);

  // Hydrate persisted session after mount (avoids SSR mismatch).
  useEffect(() => {
    let initialDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          scores?: Partial<Scores>;
          theme?: unknown;
          muted?: unknown;
          darkMode?: unknown;
        };
        const n = (v: unknown) =>
          typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;
        /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
        setScores({
          p1: n(saved.scores?.p1),
          p2: n(saved.scores?.p2),
          draws: n(saved.scores?.draws),
        });
        if (isThemeId(saved.theme)) setThemeId(saved.theme);
        if (saved.muted === true) {
          setMutedState(true);
          setMuted(true);
        }
        if (typeof saved.darkMode === "boolean") {
          initialDark = saved.darkMode;
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setDarkMode(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Persist once hydrated and keep <html> dark class in sync.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ scores, theme: themeId, muted, darkMode }),
      );
    } catch {
      // storage unavailable
    }
  }, [mounted, scores, themeId, muted, darkMode]);

  // Derived state
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const moves = board.reduce((n, c) => (c ? n + 1 : n), 0);
  const { winner, winningLine } = findWin(board);
  const isDraw = !winner && moves === 9;
  const gameOver = winner !== null || isDraw;
  const turn: PlayerId = moves % 2 === 0 ? starter : other(starter);

  const celebrate = useCallback(async () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { default: confetti } = await import("canvas-confetti");
    void confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  }, []);

  const handleMove = (i: number) => {
    if (board[i] || gameOver) return;
    const next = board.slice();
    next[i] = turn;
    setBoard(next);

    const result = findWin(next);
    if (result.winner) {
      const w = result.winner;
      setScores((s) => ({ ...s, [w]: s[w] + 1 }));
      play("win");
      void celebrate();
    } else if (moves + 1 === 9) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      play("draw");
    } else {
      play(turn);
    }
  };

  const newGame = () => {
    play("click");
    setBoard(EMPTY_BOARD);
    // Alternate who goes first each round (only once a round was played).
    if (moves > 0) setStarter(other(starter));
  };

  const resetScores = () => {
    play("click");
    setScores(ZERO_SCORES);
  };

  const chooseTheme = (id: ThemeId) => {
    if (id === themeId) return;
    setThemeId(id);
    play("click");
  };

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    if (!next) play("click");
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    play("click");
  };

  const chooseStarter = (p: PlayerId) => {
    if (moves > 0 || p === starter) return;
    setStarter(p);
    play("click");
  };

  const canPickStarter = moves === 0;
  const names = theme.names;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center gap-3 px-4 py-3 text-black sm:gap-4 sm:py-5 dark:text-zinc-100">
      <header className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
          Tic-Tac-Toe
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={darkMode}
            className={`flex size-11 items-center justify-center rounded-lg border-2 border-black bg-white dark:border-zinc-100 dark:bg-zinc-900 ${SHADOW} ${PRESS}`}
          >
            {darkMode ? (
              <Sun aria-hidden="true" className="size-5 text-amber-300" />
            ) : (
              <Moon aria-hidden="true" className="size-5" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
            aria-pressed={muted}
            className={`flex size-11 items-center justify-center rounded-lg border-2 border-black bg-white dark:border-zinc-100 dark:bg-zinc-900 ${SHADOW} ${PRESS}`}
          >
            {muted ? (
              <VolumeX aria-hidden="true" className="size-5" />
            ) : (
              <Volume2 aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </header>

      <div
        role="group"
        aria-label="Battle Theme"
        className="flex w-full flex-wrap justify-center gap-2"
      >
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === themeId}
            onClick={() => chooseTheme(t.id)}
            className={`min-h-10 rounded-full border-2 border-black px-3 py-1 text-xs font-bold sm:text-sm dark:border-zinc-100 ${SHADOW} ${PRESS} ${
              t.id === themeId
                ? "bg-yellow-300 dark:bg-amber-400 dark:text-black"
                : "bg-white dark:bg-zinc-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section
        aria-label="Scoreboard"
        className="grid w-full grid-cols-3 gap-2 sm:gap-3"
      >
        {(["p1", "p2"] as const).map((p) => {
          const active = canPickStarter && starter === p;
          return (
            <button
              key={p}
              type="button"
              disabled={!canPickStarter}
              onClick={() => chooseStarter(p)}
              aria-label={`${names[p]}: ${scores[p]} wins${
                active ? ", goes first" : ""
              }${canPickStarter ? ". Click to go first" : ""}`}
              className={`flex flex-col items-center gap-0.5 rounded-lg border-2 border-black p-2 dark:border-zinc-100 ${SHADOW} ${PRESS} disabled:cursor-default disabled:hover:translate-y-0 ${
                turn === p && !gameOver
                  ? "bg-yellow-200 dark:bg-amber-300 dark:text-black"
                  : "bg-white dark:bg-zinc-900"
              }`}
            >
              <Mark theme={theme} player={p} size={32} />
              <span className="max-w-full truncate text-xs font-bold">
                {names[p]}
              </span>
              <span className="text-2xl font-black tabular-nums leading-none">
                {mounted ? scores[p] : 0}
              </span>
              <span className="text-[10px] font-bold uppercase leading-none">
                {active ? "Starts" : "Wins"}
              </span>
            </button>
          );
        })}
        <div
          className={`col-start-3 row-start-1 flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-black bg-white p-2 dark:border-zinc-100 dark:bg-zinc-900 ${SHADOW}`}
          style={{ gridColumnStart: 3 }}
        >
          <span className="text-2xl" aria-hidden="true">
            🤝
          </span>
          <span className="text-xs font-bold">Draws</span>
          <span className="text-2xl font-black tabular-nums leading-none">
            {mounted ? scores.draws : 0}
          </span>
        </div>
      </section>

      <div
        aria-live="polite"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-3 py-2 text-center text-base font-black sm:text-lg dark:border-zinc-100 dark:bg-zinc-900"
      >
        {winner ? (
          <>
            <Mark theme={theme} player={winner} size={28} />
            <span>🎉 {names[winner]} wins!</span>
          </>
        ) : isDraw ? (
          <span>It&apos;s a draw!</span>
        ) : (
          <>
            <Mark theme={theme} player={turn} size={28} />
            <span>{names[turn]}&apos;s turn</span>
          </>
        )}
      </div>

      <div
        role="group"
        aria-label="Tic-Tac-Toe board"
        className="grid aspect-square w-[min(92vw,44dvh,26rem)] grid-cols-3 grid-rows-3 gap-2 rounded-xl border-4 border-black bg-black p-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:border-zinc-100 dark:bg-zinc-800 dark:shadow-[6px_6px_0px_0px_rgba(244,244,245,0.9)]"
      >
        {board.map((cell, i) => {
          const row = Math.floor(i / 3) + 1;
          const col = (i % 3) + 1;
          const isWin = winningLine?.includes(i) ?? false;
          const label = `Row ${row}, Column ${col}, ${
            cell ? `marked by ${names[cell]}` : "empty"
          }`;
          const interactive = !cell && !gameOver;
          return (
            <button
              key={i}
              type="button"
              aria-label={label}
              aria-disabled={!interactive}
              onClick={() => handleMove(i)}
              className={`flex aspect-square min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-md border-2 border-black touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black dark:border-zinc-100 dark:focus-visible:ring-amber-300 dark:focus-visible:ring-offset-zinc-800 ${
                isWin
                  ? "win-pulse bg-emerald-400 dark:text-black"
                  : interactive
                    ? `bg-[#FFFDF5] dark:bg-zinc-900 ${SHADOW} transition-all hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none`
                    : "bg-[#FFFDF5] dark:bg-zinc-900 cursor-default"
              }`}
            >
              {cell && (
                <span key={`${themeId}-${cell}`} className="pop-in flex">
                  <Mark
                    theme={theme}
                    player={cell}
                    size={96}
                    className="size-[min(18vw,9dvh,5rem)]"
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={newGame}
          className={`min-h-12 flex-1 rounded-lg border-2 border-black bg-yellow-300 px-4 text-base font-black uppercase dark:border-zinc-100 dark:bg-amber-400 dark:text-black ${SHADOW} ${PRESS}`}
        >
          New Game
        </button>
        <button
          type="button"
          onClick={resetScores}
          className={`min-h-12 rounded-lg border-2 border-black bg-white px-4 text-sm font-bold dark:border-zinc-100 dark:bg-zinc-900 ${SHADOW} ${PRESS}`}
        >
          Reset Scores
        </button>
      </div>

      <footer className="mt-auto pt-1 text-center text-xs font-medium text-black/60 dark:text-zinc-400">
        developed by Jan Wayne
      </footer>
    </main>
  );
}
