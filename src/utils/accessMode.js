const ACCESS_MODE_ALIASES = {
  OPEN_ACCESS: 'OPEN_ACCESS',
  OPENACCESS: 'OPEN_ACCESS',
  'OPEN ACCESS': 'OPEN_ACCESS',
  'OPEN-ACCESS': 'OPEN_ACCESS',
  SLOT_BASED: 'SLOT_BASED',
  'SLOT BASED': 'SLOT_BASED',
  'SLOT-BASED': 'SLOT_BASED',
  APPOINTMENT: 'APPOINTMENT_ONLY',
  APPOINTMENT_ONLY: 'APPOINTMENT_ONLY',
  'APPOINTMENT ONLY': 'APPOINTMENT_ONLY',
  'APPOINTMENT-ONLY': 'APPOINTMENT_ONLY',
  // Resource-based access: sports facilities with bookable courts/lanes
  RESOURCE_BASED: 'RESOURCE_BASED',
  'RESOURCE BASED': 'RESOURCE_BASED',
  'RESOURCE-BASED': 'RESOURCE_BASED',
};

export const normalizeAccessMode = value => {
  if (!value) return '';
  const raw = String(value).trim().toUpperCase().replace(/\s+/g, ' ');
  return ACCESS_MODE_ALIASES[raw] || ACCESS_MODE_ALIASES[raw.replace(/ /g, '_')] || raw;
};

export const resolveAccessMode = (...candidates) => {
  for (const candidate of candidates.flat()) {
    const normalized = normalizeAccessMode(candidate);
    if (normalized) return normalized;
  }
  return '';
};

export const isOpenAccessMode = (...candidates) =>
  resolveAccessMode(...candidates) === 'OPEN_ACCESS';

