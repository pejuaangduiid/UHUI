const HASH_REGEX = /^[0-9a-f]{64}$/;

export function isValidSha256(hash: string): boolean {
  return HASH_REGEX.test(hash.toLowerCase());
}

export function getVerifyUrl(hash: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  return `${base}/verify/${hash.toLowerCase()}`;
}

export function truncateHash(hash: string, head = 8, tail = 8): string {
  if (hash.length <= head + tail) return hash;
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

