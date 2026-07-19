function tokenize(text) {
  if (typeof text !== "string" || text.length === 0) return [];
  const STOP_WORDS = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "in",
    "on",
    "at",
    "of",
    "to",
    "for",
    "with",
    "by",
  ]);
  const normalized = text
    .toLowerCase()
    .split(/[^a-zA-Zа-яА-ЯёЁ0-9]+/)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));

  return Array.from(new Set(normalized));
}
module.exports = { tokenize };
