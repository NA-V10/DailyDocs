import sharp from "sharp";

export interface CompressToTargetOptions {
  width: number;
  height: number;
  minSizeBytes?: number;
  maxSizeBytes: number;
}

export interface CompressToTargetResult {
  data: Buffer;
  sizeBytes: number;
  meetsRequirement: boolean;
}

function isInRange(size: number, min: number, max: number): boolean {
  return size >= min && size <= max;
}

/**
 * Resizes an image to exact target pixel dimensions (cropping to fill, like a photo-booth
 * print) and binary-searches JPEG quality (1-100, monotonic enough with output size for this
 * purpose) for output that falls within [minSizeBytes, maxSizeBytes] — the byte window most
 * portal photo/signature specs impose. A fixed step ladder can jump clean over a narrow window
 * (e.g. a 10KB-wide signature spec); binary search homes in on it reliably instead. Returns the
 * closest achievable result even when the window can't be hit exactly (flagged via
 * `meetsRequirement`), rather than silently returning something out of spec.
 */
export async function compressImageToTarget(
  input: Buffer,
  options: CompressToTargetOptions
): Promise<CompressToTargetResult> {
  const { width, height, maxSizeBytes } = options;
  const minSizeBytes = options.minSizeBytes ?? 0;

  const base = sharp(input).rotate().resize({ width, height, fit: "cover", position: "attention" });

  let closest: Buffer | null = null;
  let closestDistance = Infinity;

  function consider(candidate: Buffer) {
    const distance =
      candidate.length > maxSizeBytes
        ? candidate.length - maxSizeBytes
        : minSizeBytes - candidate.length;
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = candidate;
    }
  }

  let low = 1;
  let high = 100;
  let bestInRange: Buffer | null = null;

  for (let iterations = 0; iterations < 12 && low <= high; iterations++) {
    const quality = Math.floor((low + high) / 2);
    const candidate = await base.clone().jpeg({ quality }).toBuffer();

    if (isInRange(candidate.length, minSizeBytes, maxSizeBytes)) {
      bestInRange = candidate;
      break;
    }

    consider(candidate);

    if (candidate.length > maxSizeBytes) {
      high = quality - 1; // too big — need lower quality
    } else {
      low = quality + 1; // too small — need higher quality
    }
  }

  const finalBuffer = bestInRange ?? closest ?? (await base.jpeg({ quality: 1 }).toBuffer());
  return {
    data: finalBuffer,
    sizeBytes: finalBuffer.length,
    meetsRequirement: isInRange(finalBuffer.length, minSizeBytes, maxSizeBytes),
  };
}
