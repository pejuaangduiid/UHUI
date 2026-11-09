export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  sme: {
    all: () => ["smes"] as const,
    detail: (id: string) => ["smes", id] as const,
    transactions: (id: string, filter?: Record<string, unknown>) =>
      ["smes", id, "transactions", filter ?? {}] as const,
    inventory: (id: string) => ["smes", id, "inventory"] as const,
    documents: (id: string) => ["smes", id, "documents"] as const,
    readiness: (id: string, scheme?: string) =>
      ["smes", id, "readiness", scheme ?? ""] as const,
    aiReports: (id: string) => ["smes", id, "ai-reports"] as const,
    reports: (id: string, docType?: string, period?: string) =>
      ["smes", id, "reports", docType ?? "", period ?? ""] as const,
  },
  verify: (hash: string) => ["verify", hash] as const,
  bursa: {
    all: (filter?: Record<string, unknown>) =>
      ["bursa", "campaigns", filter ?? {}] as const,
    detail: (slug: string) => ["bursa", "campaign", slug] as const,
  },
  portfolio: {
    me: () => ["portfolio", "me"] as const,
  },
  admin: {
    reviewQueue: (filter?: Record<string, unknown>) =>
      ["admin", "review-queue", filter ?? {}] as const,
    campaignQueue: () => ["admin", "campaign-queue"] as const,
    stats: () => ["admin", "stats"] as const,
    smes: () => ["admin", "smes"] as const,
    campaigns: () => ["admin", "campaigns"] as const,
    courses: () => ["admin", "courses"] as const,
    lessons: (courseId: string) => ["admin", "courses", courseId, "lessons"] as const,
    threads: (limit?: number) => ["admin", "threads", limit ?? 50] as const,
    suspendedUsers: () => ["admin", "suspended-users"] as const,
  },
  community: {
    hub: (limit?: number) => ["community", "hub", limit ?? 50] as const,
    boardroom: (smeId: string, limit?: number) => ["community", "boardroom", smeId, limit ?? 50] as const,
    thread: (id: string) => ["community", "thread", id] as const,
    comments: (threadId: string) => ["community", "comments", threadId] as const,
  },
  campaigns: {
    bySme: (smeId: string) => ["smes", smeId, "campaigns"] as const,
    distributions: (campaignId: string) => ["campaigns", campaignId, "distributions"] as const,
  },
} as const;
