import { z } from "zod";

export const batchRenameFormSchema = z.object({
  baseName: z
    .string()
    .trim()
    .min(1, "Enter a base name, e.g. Certificate.")
    .max(100, "Keep it under 100 characters."),
  startNumber: z
    .number({ error: "Enter a starting number." })
    .int("Must be a whole number.")
    .min(0, "Must be 0 or greater.")
    .max(1_000_000, "That's too large."),
  padding: z
    .number({ error: "Enter a padding amount." })
    .int("Must be a whole number.")
    .min(0, "Must be 0 or greater.")
    .max(6, "6 digits is the max."),
  separator: z.enum(["-", "_", " ", ""]),
});

export type BatchRenameFormValues = z.infer<typeof batchRenameFormSchema>;
