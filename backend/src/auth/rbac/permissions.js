/**
 * Centralized Role-Based Access Control (RBAC) Definition
 * Roles: admin, engineer, operator, viewer
 */

export const ROLES = Object.freeze({
  ADMIN: "admin",
  ENGINEER: "engineer",
  OPERATOR: "operator",
  VIEWER: "viewer",
});

export const PERMISSIONS = Object.freeze({
  // Dashboard & Real-time
  DASHBOARD_READ: "dashboard:read",
  SENSORS_READ: "sensors:read",
  SENSORS_CONFIGURE: "sensors:configure",

  // Stations
  STATIONS_READ: "stations:read",
  STATIONS_CREATE: "stations:create",
  STATIONS_UPDATE: "stations:update",
  STATIONS_DELETE: "stations:delete",

  // Telemetry History & Anomalies
  HISTORY_READ: "history:read",
  ANOMALIES_READ: "anomalies:read",

  // Alerts & Incident Response
  ALERTS_READ: "alerts:read",
  ALERTS_ACKNOWLEDGE: "alerts:acknowledge",
  ALERTS_RESOLVE: "alerts:resolve",

  // Maintenance Management
  MAINTENANCE_READ: "maintenance:read",
  MAINTENANCE_CREATE: "maintenance:create",
  MAINTENANCE_UPDATE: "maintenance:update",

  // User & Identity Governance
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  ROLES_MANAGE: "roles:manage",

  // Diagnostics, Observability & System
  AUDIT_READ: "audit:read",
  METRICS_READ: "metrics:read",
  SIMULATION_RUN: "simulation:run",
  SYSTEM_CONFIGURE: "system:configure",
});

/**
 * Explicit mapping of roles to their permitted capabilities
 */
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SENSORS_READ,
    PERMISSIONS.SENSORS_CONFIGURE,
    PERMISSIONS.STATIONS_READ,
    PERMISSIONS.STATIONS_CREATE,
    PERMISSIONS.STATIONS_UPDATE,
    PERMISSIONS.STATIONS_DELETE,
    PERMISSIONS.HISTORY_READ,
    PERMISSIONS.ANOMALIES_READ,
    PERMISSIONS.ALERTS_READ,
    PERMISSIONS.ALERTS_ACKNOWLEDGE,
    PERMISSIONS.ALERTS_RESOLVE,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_UPDATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.ROLES_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.METRICS_READ,
    PERMISSIONS.SIMULATION_RUN,
    PERMISSIONS.SYSTEM_CONFIGURE,
  ],

  [ROLES.ENGINEER]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SENSORS_READ,
    PERMISSIONS.SENSORS_CONFIGURE,
    PERMISSIONS.STATIONS_READ,
    PERMISSIONS.STATIONS_CREATE,
    PERMISSIONS.STATIONS_UPDATE,
    PERMISSIONS.STATIONS_DELETE,
    PERMISSIONS.HISTORY_READ,
    PERMISSIONS.ANOMALIES_READ,
    PERMISSIONS.ALERTS_READ,
    PERMISSIONS.ALERTS_ACKNOWLEDGE,
    PERMISSIONS.ALERTS_RESOLVE,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_UPDATE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.METRICS_READ,
    PERMISSIONS.SIMULATION_RUN,
  ],

  [ROLES.OPERATOR]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SENSORS_READ,
    PERMISSIONS.STATIONS_READ,
    PERMISSIONS.HISTORY_READ,
    PERMISSIONS.ANOMALIES_READ,
    PERMISSIONS.ALERTS_READ,
    PERMISSIONS.ALERTS_ACKNOWLEDGE,
    PERMISSIONS.ALERTS_RESOLVE,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_CREATE,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SENSORS_READ,
    PERMISSIONS.STATIONS_READ,
    PERMISSIONS.HISTORY_READ,
    PERMISSIONS.ANOMALIES_READ,
    PERMISSIONS.ALERTS_READ,
  ],
});

/**
 * Returns list of allowed permissions for a given role name
 * @param {string} role
 * @returns {string[]}
 */
export function getPermissionsForRole(role) {
  if (!role) return [];
  const normalized = String(role).toLowerCase().trim();
  return ROLE_PERMISSIONS[normalized] || [];
}

/**
 * Checks whether a specific role holds the required permission
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

/**
 * Checks if a string is a valid system role
 * @param {string} role
 * @returns {boolean}
 */
export function isValidRole(role) {
  if (!role) return false;
  return Object.values(ROLES).includes(String(role).toLowerCase().trim());
}
