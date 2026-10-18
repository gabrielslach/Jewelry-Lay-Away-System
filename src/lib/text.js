export function firstSentence(text) {
  const match = text.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}
