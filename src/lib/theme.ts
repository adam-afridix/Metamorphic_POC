export type Theme = "dark" | "warm";

const KEY = "metamorph-theme";
export const THEMES: { id: Theme; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "warm", label: "Warm Lab" },
];

export function getTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "warm";
}

export function setTheme(t: Theme) {
  const el = document.documentElement;
  if (t === "dark") el.setAttribute("data-theme", "dark");
  else el.removeAttribute("data-theme");
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
}
