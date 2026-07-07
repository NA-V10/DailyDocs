import { z } from "zod";

export const textToPdfFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Enter some text to convert.")
    .max(200_000, "That's too long — 200,000 characters max."),
});

export type TextToPdfFormValues = z.infer<typeof textToPdfFormSchema>;
