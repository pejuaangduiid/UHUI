export function formatUserRole(role?: string | null): string {
  if (!role) return "Investor";
  const normalized = role.toLowerCase().trim();
  if (normalized === "sme_owner") return "Pemilik Usaha";
  if (normalized === "admin" || normalized === "superadmin") return "Admin";
  if (normalized === "mentor") return "Mentor";
  if (normalized === "investor") return "Investor";
  return "Investor";
}

