import { autoCardStops, type CardTheme } from "@repo/validators";

type FixedTheme = Exclude<CardTheme, "auto">;

/**
 * Gradient stops (top-left → bottom-right) for each FIXED warranty-card skin.
 * The `auto` theme is computed per device (see `stopsFor`). Keyed by the
 * `CardTheme` enum from @repo/validators — the single source of truth.
 */
export const CARD_THEME_STOPS: Record<FixedTheme, [string, string, string]> = {
  brand: ["#00DE6F", "#0A3F2C", "#0A0B0A"],
  ocean: ["#38BDF8", "#0E2A40", "#080A0F"],
  violet: ["#A78BFA", "#241A40", "#0A0810"],
  sunset: ["#FB923C", "#3A1C16", "#0C0A09"],
  slate: ["#94A3B8", "#222831", "#090A0C"],
};

/** Gradient stops for a card, resolving `auto` against a stable seed. */
export function stopsFor(theme: CardTheme, seed: string): [string, string, string] {
  return theme === "auto" ? autoCardStops(seed) : CARD_THEME_STOPS[theme];
}

/** Background colour for a picker swatch (auto uses a neutral chip + icon). */
export function swatchColor(theme: CardTheme): string {
  return theme === "auto" ? "#2A2A2E" : CARD_THEME_STOPS[theme][0];
}

/** Normalizes an arbitrary stored value to a known theme (defaults to auto). */
export function resolveTheme(value: string | null | undefined): CardTheme {
  if (value === "auto") return "auto";
  return value && value in CARD_THEME_STOPS ? (value as CardTheme) : "auto";
}
