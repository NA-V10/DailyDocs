"use client";

import { useMemo, useState } from "react";
import { computeWordStats } from "@/lib/text/word-stats";

export function useWordCounter() {
  const [text, setText] = useState("");
  const stats = useMemo(() => computeWordStats(text), [text]);

  return { text, setText, stats };
}
