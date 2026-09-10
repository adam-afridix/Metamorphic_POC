import { motion } from "framer-motion";
import { Sparkles, Library } from "lucide-react";
import { RELATION_TYPE_LABEL, type MetamorphicRelation } from "../data/metamorphicRelations";

const CAT_LABEL: Record<string, string> = {
  photometric: "Photometric",
  geometric: "Geometric",
  morphological: "Morphological",
  generative: "Generative / Environmental",
  domain: "Domain-specific",
};

export default function MRCard({ mr, index = 0 }: { mr: MetamorphicRelation; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`card card-pad card-hover ${
        mr.generated ? "!border-accent/30 bg-accent/[0.04]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="mono text-[11px] text-slate-600">{mr.id}</span>
        <span
          className={`chip ${
            mr.generated ? "!border-accent/30 !bg-accent/10 text-accent" : "text-slate-500"
          }`}
        >
          {mr.generated ? <Sparkles size={11} /> : <Library size={11} />}
          {mr.generated ? "LLM-discovered" : "Base library"}
        </span>
      </div>
      <div className="mt-2 text-[14px] font-semibold text-slate-100">{mr.name}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{CAT_LABEL[mr.category]}</div>
      <div className="mono mt-3 rounded-md bg-base-800 px-2.5 py-1.5 text-[10.5px] text-slate-500">
        {RELATION_TYPE_LABEL[mr.relationType]}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
        <span className="text-slate-600">Expected relation — </span>
        {mr.expected}
      </p>
    </motion.div>
  );
}
