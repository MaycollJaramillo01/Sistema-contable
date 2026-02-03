export type Role = 'admin' | 'contador' | 'tesorero' | 'lector';

export const roleHierarchy: Role[] = ['lector', 'tesorero', 'contador', 'admin'];

export function hasAtLeastRole(userRole: Role, required: Role) {
  return roleHierarchy.indexOf(userRole) >= roleHierarchy.indexOf(required);
}

export const permissions = {
  manageUsers: 'admin',
  manageCatalog: 'contador',
  postTransactions: 'tesorero',
  viewReports: 'lector'
} as const;

export type PermissionKey = keyof typeof permissions;

export function can(userRole: Role, permission: PermissionKey) {
  return hasAtLeastRole(userRole, permissions[permission]);
}
