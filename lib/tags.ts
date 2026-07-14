const TLD_SUFFIXES = new Set([
  "com", "org", "net", "io", "co", "uk", "dev", "app", "gov", "edu",
  "info", "biz", "me", "us", "ca", "de", "fr", "jp", "au",
]);

const STOPWORDS = new Set([
  "the", "and", "for", "with", "this", "that", "from", "your", "have",
  "are", "was", "were", "will", "would", "could", "should", "about",
  "into", "than", "then", "them", "they", "their", "there", "here",
  "what", "when", "where", "which", "while", "who", "whom", "why",
  "how", "all", "any", "can", "did", "does", "doing", "done", "each",
  "few", "more", "most", "other", "some", "such", "not", "only", "own",
  "same", "she", "her", "him", "his", "its", "our", "out", "over",
  "under", "again", "further", "once", "these", "those", "you", "yours",
  "yourself", "just", "now", "new", "get", "got", "one", "two",
  "https", "http", "www", "com", "html", "htm", "amp", "com",
]);

function domainToTag(domain: string): string {
  const labels = domain.split(".").filter(Boolean);
  for (let i = labels.length - 1; i >= 0; i--) {
    if (!TLD_SUFFIXES.has(labels[i])) return labels[i];
  }
  return labels[0] ?? domain;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

export function suggestTags(input: {
  domain: string;
  title: string | null;
  description: string | null;
}): string[] {
  const tags: string[] = [];
  const domainTag = domainToTag(input.domain);
  tags.push(domainTag);

  const titleTokens = input.title ? tokenize(input.title) : [];
  const descriptionTokens = input.description ? tokenize(input.description) : [];

  const frequency = new Map<string, number>();
  for (const token of titleTokens) {
    frequency.set(token, (frequency.get(token) ?? 0) + 2);
  }
  for (const token of descriptionTokens) {
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }

  const ranked = Array.from(frequency.entries())
    .filter(([token]) => token !== domainTag)
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token);

  for (const token of ranked) {
    if (tags.length >= 4) break;
    if (!tags.includes(token)) tags.push(token);
  }

  return tags;
}
