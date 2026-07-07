import { z } from "zod";

export const convertImageFormSchema = z.object({
  format: z.enum(["png", "jpeg", "webp", "avif"]),
});

export type ConvertImageFormValues = z.infer<typeof convertImageFormSchema>;
