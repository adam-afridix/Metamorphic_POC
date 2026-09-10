import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

/* ---------- animated number ---------- */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const from = display;
    const dur = 650;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(from + (value - from) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ---------- section title ---------- */
export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-semibold text-slate-100">{children}</h2>
      {hint && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

/* ---------- metric card ---------- */
export function MetricCard({
  label,
  value,
  sub,
  tone = "default",
  animate,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "default" | "pass" | "fail" | "warn" | "accent";
  animate?: { to: number; decimals?: number; suffix?: string };
}) {
  const toneClass = {
    pass: "text-pass",
    fail: "text-fail",
    warn: "text-warn",
    accent: "text-accent",
    default: "text-slate-100",
  }[tone];
  const dot = {
    pass: "bg-pass",
    fail: "bg-fail",
    warn: "bg-warn",
    accent: "bg-accent",
    default: "bg-slate-600",
  }[tone];

  return (
    <div className="card card-pad card-hover relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full w-0.5 ${dot}`} />
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="label">{label}</span>
      </div>
      <div className={`mt-3 text-[28px] font-bold leading-none ${toneClass}`}>
        {animate ? (
          <AnimatedNumber value={animate.to} decimals={animate.decimals} suffix={animate.suffix} />
        ) : (
          value
        )}
      </div>
      {sub && <div className="mt-1.5 text-[12px] text-slate-500">{sub}</div>}
    </div>
  );
}

/* ---------- progress ---------- */
export function Progress({ value, tone = "accent" }: { value: number; tone?: "accent" | "pass" }) {
  const color = tone === "pass" ? "bg-pass" : "bg-accent";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ ease: "easeOut", duration: 0.5 }}
      />
    </div>
  );
}

/* ---------- horizontal bar ---------- */
export function Bar({
  label,
  value,
  max = 1,
  tone,
}: {
  label: string;
  value: number;
  max?: number;
  tone?: "pass" | "fail" | "warn";
}) {
  const pct = Math.round((value / max) * 100);
  const color =
    tone === "fail" ? "bg-fail" : tone === "warn" ? "bg-warn" : tone === "pass" ? "bg-pass" : "bg-accent";
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0 truncate text-[13px] text-slate-400">{label}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="mono w-10 shrink-0 text-right text-slate-500">{pct}%</div>
    </div>
  );
}

/* ---------- badges ---------- */
export function ResultBadge({ result }: { result: "PASS" | "VIOLATION" }) {
  return result === "PASS" ? (
    <span className="chip !border-pass/30 !bg-pass/10 text-pass">
      <span className="h-1.5 w-1.5 rounded-full bg-pass" /> RELATION SATISFIED
    </span>
  ) : (
    <span className="chip !border-fail/30 !bg-fail/10 text-fail">
      <span className="h-1.5 w-1.5 rounded-full bg-fail" /> METAMORPHIC VIOLATION
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: "LOW" | "MEDIUM" | "HIGH" }) {
  const cls =
    severity === "HIGH"
      ? "!border-fail/30 !bg-fail/10 text-fail"
      : severity === "MEDIUM"
      ? "!border-warn/30 !bg-warn/10 text-warn"
      : "text-slate-400";
  return <span className={`chip ${cls}`}>Severity · {severity}</span>;
}

/* ---------- empty state ---------- */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card relative flex flex-col items-center justify-center gap-3 overflow-hidden py-20 text-center">
      <div className="grid-fade pointer-events-none absolute inset-0" />
      <div className="relative text-[15px] font-semibold text-slate-200">{title}</div>
      <p className="relative max-w-md text-[13px] leading-relaxed text-slate-500">{body}</p>
      {action && <div className="relative mt-1">{action}</div>}
    </div>
  );
}
