import { Circle, X } from "lucide-react";

export type PlayerId = "p1" | "p2";
export type ThemeId = "cyber" | "elemental" | "pets" | "classic";

export interface Theme {
  id: ThemeId;
  label: string;
  names: Record<PlayerId, string>;
  gifs: Record<PlayerId, string> | null;
}

const noto = (code: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.gif`;

export const THEMES: readonly Theme[] = [
  {
    id: "cyber",
    label: "Cyber Arcade",
    names: { p1: "Alien", p2: "Robot" },
    gifs: { p1: noto("1f47e"), p2: noto("1f916") },
  },
  {
    id: "elemental",
    label: "Elemental Clash",
    names: { p1: "Fire", p2: "Lightning" },
    gifs: { p1: noto("1f525"), p2: noto("26a1") },
  },
  {
    id: "pets",
    label: "Pet Showdown",
    names: { p1: "Cat", p2: "Dog" },
    gifs: { p1: noto("1f63a"), p2: noto("1f415") },
  },
  {
    id: "classic",
    label: "Classic Icons",
    names: { p1: "X", p2: "O" },
    gifs: null,
  },
];

export const DEFAULT_THEME: ThemeId = "cyber";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

interface MarkProps {
  theme: Theme;
  player: PlayerId;
  /** Pixel size for both width and height attributes. */
  size: number;
  className?: string;
}

export function Mark({ theme, player, size, className = "" }: MarkProps) {
  if (theme.gifs) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- animated GIFs must bypass the image optimizer
      <img
        src={theme.gifs[player]}
        alt=""
        width={size}
        height={size}
        decoding="async"
        draggable={false}
        className={`pointer-events-none select-none object-contain ${className}`}
      />
    );
  }
  const Icon = player === "p1" ? X : Circle;
  return (
    <Icon
      aria-hidden="true"
      width={size}
      height={size}
      strokeWidth={4}
      className={`${
        player === "p1" ? "text-orange-500" : "text-cyan-500"
      } ${className}`}
    />
  );
}
