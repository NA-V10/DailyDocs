import QRCode from "qrcode";

const MAX_TEXT_LENGTH = 2000;

export interface GenerateQrOptions {
  size?: number;
  margin?: number;
}

export async function generateQrPng(
  text: string,
  options: GenerateQrOptions = {}
): Promise<Buffer> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Enter some text or a URL to generate a QR code.");
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text is too long. Maximum length is ${MAX_TEXT_LENGTH} characters.`);
  }

  const { size = 512, margin = 2 } = options;

  return QRCode.toBuffer(trimmed, {
    type: "png",
    width: size,
    margin,
    errorCorrectionLevel: "M",
  });
}
