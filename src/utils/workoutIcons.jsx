export const getEquipmentImageUrl = (name) => {
  const normName = (name || '').toLowerCase().trim();
  let slug = normName.replace(/\s+/g, '_');
  if (slug === 'all_equipement' || slug === 'all_equipment') slug = 'all_equipment';
  return `https://api.wrkout.xyz/images/equipments/${slug}.png`;
};

export const getMuscleImageUrl = (name) => {
  const normName = (name || '').toLowerCase().trim();
  let slug = normName.replace(/\s+/g, '_');
  return `https://api.wrkout.xyz/images/muscles/${slug}.png`;
};
