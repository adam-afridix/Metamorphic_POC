import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import { EmptyState } from "./ui";

export default function RequireRun({ children }: { children: ReactNode }) {
  const { status, canStart, start } = usePipeline();
  const nav = useNavigate();
  if (status !== "idle") return <>{children}</>;

  return (
    <EmptyState
      title="No active test run"
      body="Start the agentic testing pipeline to populate this view. It walks through analysis, MR discovery, transformation, semantic validation, model inference and oracle evaluation for 10 images."
      action={
        <button
          className="btn-primary"
          onClick={() => {
            if (canStart) {
              start();
              nav("/testing");
            } else {
              nav("/setup");
            }
          }}
        >
          <Play size={16} /> {canStart ? "Start Agentic Test" : "Go to Test Setup"}
        </button>
      }
    />
  );
}
