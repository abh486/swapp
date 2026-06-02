export const QR_TYPE = Object.freeze({
  VENUE_QR: 'VENUE_QR',
  JWT_QR: 'JWT_QR',
  UNKNOWN: 'UNKNOWN',
});

export const parseVenueQrUrl = value => {
  if (!value || typeof value !== 'string') return null;

  try {
    const parsed = new URL(value);
    const providerId = parsed.searchParams.get('providerId') || parsed.searchParams.get('id');
    const sig = parsed.searchParams.get('sig');

    if (!providerId || !sig) return null;

    return {
      type: QR_TYPE.VENUE_QR,
      providerId,
      sig,
      raw: value,
    };
  } catch {
    const providerMatch = value.match(/[?&](?:providerId|id)=([^&]+)/);
    const sigMatch = value.match(/[?&]sig=([^&]+)/);

    if (!providerMatch?.[1] || !sigMatch?.[1]) return null;

    return {
      type: QR_TYPE.VENUE_QR,
      providerId: decodeURIComponent(providerMatch[1]),
      sig: decodeURIComponent(sigMatch[1]),
      raw: value,
    };
  }
};

export const identifyQrPayload = value => {
  const venuePayload = parseVenueQrUrl(value);
  if (venuePayload) return venuePayload;

  if (typeof value === 'string' && value.split('.').length === 3) {
    return {
      type: QR_TYPE.JWT_QR,
      raw: value,
    };
  }

  return {
    type: QR_TYPE.UNKNOWN,
    raw: value,
  };
};
