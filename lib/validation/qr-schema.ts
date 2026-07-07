import { z } from "zod";

export const qrFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Enter some text or a URL.")
    .max(2000, "That's too long — 2000 characters max."),
});

export type QrFormValues = z.infer<typeof qrFormSchema>;
