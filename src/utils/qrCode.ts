export const extractEanFromQrPayload = (payload: string): string | null => {
  const value = String(payload ?? "").trim();
  if (!value) return null;

  // Common case: QR contains the EAN itself
  if (/^\d{8,14}$/.test(value)) return value;

  // Try to parse as URL and extract common query params
  try {
    const url = new URL(value);
    const params = url.searchParams;
    const candidates = [
      params.get("ean"),
      params.get("barcode"),
      params.get("code"),
      params.get("gtin"),
      params.get("gtin13"),
      params.get("id"),
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      const trimmed = candidate.trim();
      if (/^\d{8,14}$/.test(trimmed)) return trimmed;
      const match = trimmed.match(/\b\d{13}\b/);
      if (match?.[0]) return match[0];
    }
  } catch {
    // ignore
  }

  // Fallback: find a 13-digit EAN anywhere in the payload
  const match = value.match(/\b\d{13}\b/);
  if (match?.[0]) return match[0];

  return null;
};

