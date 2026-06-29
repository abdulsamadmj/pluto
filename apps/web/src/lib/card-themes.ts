import { autoCardStops, type CardTheme } from "@repo/validators";

type FixedTheme = Exclude<CardTheme, "auto">;

/**
 * Tailwind gradient + ambient-glow classes for each FIXED warranty-card skin.
 * The `auto` theme is computed per device (see `autoGradient`) so it isn't here.
 * Keyed by the `CardTheme` enum from @repo/validators (the source of truth).
 */
export const CARD_THEME_CLASS: Record<FixedTheme, string> = {
  brand:
    "bg-[linear-gradient(145deg,#00DE6F_0%,#0A3F2C_35%,#0A0B0A_82%)] shadow-emerald-500/20",
  ocean:
    "bg-[linear-gradient(145deg,#38BDF8_0%,#0E2A40_35%,#080A0F_82%)] shadow-sky-500/20",
  violet:
    "bg-[linear-gradient(145deg,#A78BFA_0%,#241A40_35%,#0A0810_82%)] shadow-violet-500/20",
  sunset:
    "bg-[linear-gradient(145deg,#FB923C_0%,#3A1C16_35%,#0C0A09_82%)] shadow-orange-500/20",
  slate:
    "bg-[linear-gradient(145deg,#94A3B8_0%,#222831_35%,#090A0C_82%)] shadow-black/40",
};

/** Inline CSS gradient for the `auto` theme, derived from a stable seed. */
export function autoGradient(seed: string): string {
  const [accent, mid, end] = autoCardStops(seed);
  return `linear-gradient(145deg, ${accent} 0%, ${mid} 35%, ${end} 82%)`;
}

/** Gradient/glow classes for a card face. Auto carries only a neutral shadow
 * (its gradient is applied inline via `autoGradient`). */
export function themeClass(theme: CardTheme): string {
  return theme === "auto" ? "shadow-black/40" : CARD_THEME_CLASS[theme];
}

/** Background class for a picker swatch (auto shows a multi-hue chip). */
export function swatchClass(theme: CardTheme): string {
  return theme === "auto"
    ? "bg-[linear-gradient(135deg,#00DE6F_0%,#3B82F6_38%,#A78BFA_68%,#FB923C_100%)]"
    : CARD_THEME_CLASS[theme];
}

/** Normalizes an arbitrary stored value to a known theme (defaults to auto). */
export function resolveTheme(value: string | null | undefined): CardTheme {
  if (value === "auto") return "auto";
  return value && value in CARD_THEME_CLASS ? (value as CardTheme) : "auto";
}
