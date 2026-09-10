import { useState } from "react";
import { Moon, FlaskConical } from "lucide-react";
import { getTheme, setTheme, THEMES, type Theme } from "../lib/theme";

const ICON = { dark: Moon, warm: FlaskConical } as const;

export default function ThemeToggle() {
  const [theme, set] = useState<Theme>(getTheme());

  const choose = (t: Theme) => {
    setTheme(t);
    set(t);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-lg border border-base-700 bg-base-800 p-0.5"
    >
      {THEMES.map(({ id, label }) => {
        const Icon = ICON[id];
        const active = theme === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={active}
            onClick={() => choose(id)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              active
                ? "bg-accent/12 text-accent ring-1 ring-accent/25"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
