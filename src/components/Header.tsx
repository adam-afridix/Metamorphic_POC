import { useLocation } from "react-router-dom";
import { Gauge, RotateCcw } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import ThemeToggle from "./ThemeToggle";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/setup": "Test Setup",
  "/analysis": "AI Analysis",
  "/mr": "MR Generation & Validation",
  "/testing": "Agentic Test Execution",
  "/results": "Results",
  "/violations": "Violations",
  "/report": "Metamorphic Testing Report",
};

export default function Header() {
  const { pathname } = useLocation();
  const { status, fast, toggleFast, reset } = usePipeline();

  const dot =
    status === "running"
      ? "bg-accent animate-pulseline"
      : status === "done"
      ? "bg-pass"
      : "bg-slate-600";
  const statusText =
    status === "idle"
      ? "Ready"
      : status === "done"
      ? "Complete"
      : status === "paused"
      ? "Paused"
      : "Running";

  return (
    <header className="glass sticky top-0 z-10 flex items-center justify-between border-b hairline bg-base-950/80 px-6 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            Metamorph · Agentic Metamorphic Testing
          </div>
          <h1 className="text-[15px] font-semibold text-slate-100">{TITLES[pathname] ?? "Metamorph"}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="mono hidden text-slate-500 sm:inline">{statusText}</span>
        {status !== "idle" && (
          <>
            <button
              onClick={toggleFast}
              className="btn-ghost !rounded-md !px-2.5 !py-1.5 !text-xs !font-medium"
              title="Toggle animation speed"
            >
              <Gauge size={13} />
              {fast ? "Fast" : "Presenter"}
            </button>
            <button
              onClick={reset}
              className="btn-ghost !rounded-md !px-2.5 !py-1.5 !text-xs !font-medium"
              title="Reset the whole run"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
