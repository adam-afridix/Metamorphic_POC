import { Fragment } from "react";
import {
  Images,
  ScanText,
  Sparkles,
  Wand2,
  ScanSearch,
  Boxes,
  ShieldCheck,
  Database,
  Check,
  type LucideIcon,
} from "lucide-react";
import { CASE_STAGES, type CaseStage } from "../services/pipeline";

const ICONS: Record<CaseStage, LucideIcon> = {
  pick: Images,
  describe: ScanText,
  plan: Sparkles,
  transform: Wand2,
  clip: ScanSearch,
  model: Boxes,
  verify: ShieldCheck,
  store: Database,
};

export default function StageChecklist({
  state,
}: {
  state: Record<CaseStage, "done" | "active" | "todo">;
}) {
  return (
    <ol className="flex items-start">
      {CASE_STAGES.map((s, i) => {
        const st = state[s.key];
        const Icon = ICONS[s.key];
        return (
          <Fragment key={s.key}>
            {i > 0 && (
              <li
                aria-hidden
                className={`mt-[15px] h-px flex-1 ${
                  st !== "todo" ? "bg-accent/40" : "bg-base-700"
                }`}
              />
            )}
            <li className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 text-center">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full border ${
                  st === "done"
                    ? "border-accent/50 bg-accent/15 text-accent"
                    : st === "active"
                    ? "animate-pulse border-accent bg-accent/10 text-accent"
                    : "border-base-700 text-slate-600"
                }`}
              >
                {st === "done" ? <Check size={15} /> : <Icon size={15} />}
              </span>
              <span
                className={`text-[10px] leading-tight ${
                  st === "todo" ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
