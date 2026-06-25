export type AdminRole = "admin" | "moderator" | "editor";

export type AdminPermission =
  | "team.manage"
  | "settings.view"
  | "users.write"
  | "users.read"
  | "cards.write"
  | "cards.read"
  | "verification.write"
  | "audit.read";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  admin: [
    "team.manage",
    "settings.view",
    "users.write",
    "users.read",
    "cards.write",
    "cards.read",
    "verification.write",
    "audit.read",
  ],
  moderator: [
    "settings.view",
    "users.read",
    "cards.write",
    "cards.read",
    "verification.write",
    "audit.read",
  ],
  editor: ["cards.read", "audit.read"],
};

export function adminHasPermission(
  role: AdminRole,
  permission: AdminPermission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isAdminRole(value: string): value is AdminRole {
  return value === "admin" || value === "moderator" || value === "editor";
}

export const ADMIN_NAV_PERMISSIONS: Record<string, AdminPermission> = {
  "/admin": "cards.read",
  "/admin/cards": "cards.read",
  "/admin/verification": "verification.write",
  "/admin/changes": "cards.read",
  "/admin/analytics": "cards.read",
  "/admin/users": "users.read",
  "/admin/audit": "audit.read",
  "/admin/settings": "settings.view",
  "/admin/team": "team.manage",
};

export function canAccessAdminPath(role: AdminRole, path: string): boolean {
  if (path.startsWith("/admin/users/") && path !== "/admin/users") {
    return adminHasPermission(role, "users.read");
  }
  if (path.startsWith("/admin/cards/") && path !== "/admin/cards") {
    return adminHasPermission(role, "cards.read");
  }
  for (const [prefix, permission] of Object.entries(ADMIN_NAV_PERMISSIONS)) {
    if (path === prefix || (prefix !== "/admin" && path.startsWith(prefix))) {
      return adminHasPermission(role, permission);
    }
  }
  return path === "/admin" && adminHasPermission(role, "cards.read");
}
