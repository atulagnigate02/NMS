/**
 * Permission helper utilities for RBAC
 */

/**
 * Check if user has a specific permission
 * @param {string[]} userPermissions - Array of permission codes (e.g., ["devices:read", "devices:create"])
 * @param {string} requiredPermission - Permission code to check (e.g., "devices:read")
 * @returns {boolean}
 */
export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return userPermissions.includes(requiredPermission);
};

/**
 * Check if user has any of the specified permissions
 * @param {string[]} userPermissions - Array of permission codes
 * @param {string[]} requiredPermissions - Array of permission codes to check
 * @returns {boolean}
 */
export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return requiredPermissions.some(perm => userPermissions.includes(perm));
};

/**
 * Check if user has all of the specified permissions
 * @param {string[]} userPermissions - Array of permission codes
 * @param {string[]} requiredPermissions - Array of permission codes to check
 * @returns {boolean}
 */
export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return requiredPermissions.every(perm => userPermissions.includes(perm));
};

/**
 * Check if user can perform a specific action on a module
 * @param {string[]} userPermissions - Array of permission codes
 * @param {string} module - Module name (e.g., "devices")
 * @param {string} action - Action name (e.g., "read", "create", "update", "delete")
 * @returns {boolean}
 */
export const canPerformAction = (userPermissions, module, action) => {
  return hasPermission(userPermissions, `${module}:${action}`);
};

/**
 * Get all permissions for a specific module
 * @param {string[]} userPermissions - Array of permission codes
 * @param {string} module - Module name (e.g., "devices")
 * @returns {string[]} Array of action permissions for the module
 */
export const getModulePermissions = (userPermissions, module) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return [];
  return userPermissions.filter(perm => perm.startsWith(`${module}:`));
};
