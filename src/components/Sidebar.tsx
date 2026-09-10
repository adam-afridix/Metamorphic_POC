import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  SlidersHorizontal,
  ScanEye,
  Sparkles,
  Play,
  BarChart3,
  TriangleAlert,
  FileText,
} from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/setup", label: "Test Setup", icon: SlidersHorizontal },
  { to: "/analysis", label: "AI Analysis", icon: ScanEye },
  { to: "/mr", label: "MR Generation", icon: Sparkles },
  { to: "/testing", label: "Testing", icon: Play },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/violations", label: "Violations", icon: TriangleAlert },
  { to: "/report", label: "Final Report", icon: FileText },
];

export default function Sidebar() {
  const { status, memory, progress } = usePipeline();

  return (
    <aside className="glass flex w-[236px] shrink-0 flex-col border-r hairline bg-black/20">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent/25 to-violet/20 text-accent ring-1 ring-white/10">
          <Sparkles size={17} />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-bold tracking-tight text-slate-100">Metamorph</div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-600">Metamorphic Testing</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            {({ isActive }) => (
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-accent/12 ring-1 ring-accent/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <div
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    isActive ? "text-accent" : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-xl border hairline bg-white/[0.03] p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Pipeline</span>
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              status === "running"
                ? "text-accent"
                : status === "done"
                ? "text-pass"
                : status === "paused"
                ? "text-warn"
                : "text-slate-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === "running"
                  ? "animate-pulseline bg-accent"
                  : status === "done"
                  ? "bg-pass"
                  : status === "paused"
                  ? "bg-warn"
                  : "bg-slate-600"
              }`}
            />
            {status}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-accent"
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>{memory.testsCompleted}/10 tests</span>
          <span className="text-fail">{memory.violations} violations</span>
        </div>
      </div>
    </aside>
  );
}
