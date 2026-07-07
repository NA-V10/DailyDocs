import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ToolProcessingState } from "@/types/tool";

interface ProgressIndicatorProps {
  state: ToolProcessingState;
  percent: number;
}

const STATE_LABEL: Record<ToolProcessingState, string> = {
  idle: "",
  uploading: "Uploading",
  processing: "Processing",
  success: "Done",
  error: "Failed",
};

export function ProgressIndicator({ state, percent }: ProgressIndicatorProps) {
  if (state === "idle") return null;

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="flex items-center gap-2">
          {(state === "uploading" || state === "processing") && (
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
          )}
          {STATE_LABEL[state]}
        </span>
        {state !== "success" && state !== "error" && (
          <span className="text-muted-foreground">{percent}%</span>
        )}
      </div>
      <Progress value={state === "success" ? 100 : percent} />
    </div>
  );
}
