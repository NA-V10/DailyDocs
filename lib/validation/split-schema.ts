import { z } from "zod";

const RANGES_PATTERN = /^\d+(-\d+)?(,\s*\d+(-\d+)?)*$/;

export const splitFormSchema = z
  .object({
    mode: z.enum(["all", "ranges"]),
    ranges: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode !== "ranges") return;

    if (!data.ranges) {
      ctx.addIssue({
        code: "custom",
        path: ["ranges"],
        message: "Enter at least one page range, e.g. 1-3 or 5.",
      });
      return;
    }

    if (!RANGES_PATTERN.test(data.ranges)) {
      ctx.addIssue({
        code: "custom",
        path: ["ranges"],
        message: "Use page numbers and ranges like 1-3,5,7-9.",
      });
    }
  });

export type SplitFormValues = z.infer<typeof splitFormSchema>;
