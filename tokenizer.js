function tokenize(text) {
  if (typeof text !== "string" || text.length === 0) return [];

  const normalized = text
    .toLowerCase()
    .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "") // only rus/eng
    .split(/\s+/)
    .filter((word) => word.length > 0);

  return Array.from(new Set(normalized));
}
module.exports = { tokenize };
