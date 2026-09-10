const CONVENTIONAL = [
  "Assemble a representative test dataset",
  "Run the model",
  "Compute aggregate metrics",
  "Inspect failing examples",
];

const METAMORPH = [
  "Analyse the model and domain",
  "Discover candidate metamorphic relations",
  "Validate the relations",
  "Select useful follow-up tests",
  "Generate & semantically check transformations",
  "Test the model and verify each relation",
  "Record findings and prioritise further testing",
];

export default function WhyMetamorph({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card card-pad">
      <div className="label mb-1">Why metamorphic testing</div>
      <p className="mb-4 max-w-3xl text-[13px] leading-relaxed text-slate-400">
        Conventional testing evaluates a fixed set of predefined test cases. Metamorphic testing
        generates additional follow-up tests from relationships between an input and the model's
        expected behaviour — it complements a conventional test set rather than replacing it.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border hairline bg-base-800 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Conventional testing
          </div>
          <ol className="space-y-1.5 text-[12.5px] text-slate-400">
            {CONVENTIONAL.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="mono text-slate-600">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-lg border border-accent/25 bg-accent/[0.05] p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-accent">
            Metamorph
          </div>
          <ol className="space-y-1.5 text-[12.5px] text-slate-300">
            {METAMORPH.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="mono text-accent/60">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {!compact && (
        <p className="mt-3 text-[11.5px] text-slate-500">
          Key difference: instead of relying only on predefined test cases, Metamorph uses model
          behaviour and metamorphic relations to generate meaningful follow-up tests.
        </p>
      )}
    </div>
  );
}
