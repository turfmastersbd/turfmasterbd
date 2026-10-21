import { ROLE_PERMISSIONS } from "./rolePermissions";

export function hasPermission(role, permission) {
  if (role === "SUPER_ADMIN") return true;

  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}