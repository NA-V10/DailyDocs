import { PDFDocument, degrees } from "pdf-lib";

export type RotationDirection = "clockwise" | "counterclockwise" | "180";

const ANGLE_BY_DIRECTION: Record<RotationDirection, number> = {
  clockwise: 90,
  counterclockwise: -90,
  "180": 180,
};

export async function rotatePdf(input: Buffer, direction: RotationDirection): Promise<Buffer> {
  const doc = await PDFDocument.load(input);
  const delta = ANGLE_BY_DIRECTION[direction];

  for (const page of doc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((((current + delta) % 360) + 360) % 360));
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
