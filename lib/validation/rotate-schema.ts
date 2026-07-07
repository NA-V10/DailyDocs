import { z } from "zod";

export const rotateFormSchema = z.object({
  direction: z.enum(["clockwise", "counterclockwise", "180"]),
});

export type RotateFormValues = z.infer<typeof rotateFormSchema>;
