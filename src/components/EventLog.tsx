import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Info, TriangleAlert, ScanSearch } from "lucide-react";
import type { Frame } from "../services/pipeline";

const ICON = {
  agent: Bot,
  pass: Check,
  fail: TriangleAlert,
  clip: ScanSearch,
  info: Info,
};
const COLOR = {
  agent: "text-accent",
  pass: "text-pass",
  fail: "text-fail",
  clip: "text-warn",
  info: "text-slate-400",
};

export default function EventLog({ events, height = "h-full" }: { events: Frame[]; height?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  return (
    <div ref={ref} className={`${height} space-y-1.5 overflow-y-auto pr-1`}>
      <AnimatePresence initial={false}>
        {events.map((e, i) => {
          const Icon = ICON[e.kind];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2.5 rounded-md border border-base-700/40 bg-base-900/40 px-3 py-2"
            >
              <Icon size={14} className={`mt-0.5 shrink-0 ${COLOR[e.kind]}`} />
              <span className="mono leading-snug text-slate-300">{e.text}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {events.length === 0 && (
        <div className="mono px-3 py-2 text-slate-600">awaiting pipeline start…</div>
      )}
    </div>
  );
}
