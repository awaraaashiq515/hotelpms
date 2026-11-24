/**
 * src/server/auth/permissions.ts
 * WP-0.7: Centralized RBAC permission definitions.
 */

export const PERMISSIONS = {
  // Bookings & Front Office
  BOOKINGS_VIEW: 'bookings.view',
  BOOKINGS_CREATE: 'bookings.create',
  BOOKINGS_EDIT: 'bookings.edit',
  BOOKINGS_CANCEL: 'bookings.cancel',

  // Folio & Cashiering
  FOLIO_VIEW: 'folio.view',
  FOLIO_CHARGE: 'folio.charge',
  FOLIO_PAYMENT: 'folio.payment',
  FOLIO_DISCOUNT_APPLY: 'folio.discount.apply',
  FOLIO_DISCOUNT_APPROVE: 'folio.discount.approve',

  // POS & KDS
  POS_ORDER_CREATE: 'pos.order.create',
  POS_DAY_CLOSE: 'pos.day_close',

  // Housekeeping & Maintenance
  HOUSEKEEPING_MANAGE: 'housekeeping.manage',
  MAINTENANCE_MANAGE: 'maintenance.manage',

  // Spa & Banquet
  SPA_MANAGE: 'spa.manage',
  BANQUET_MANAGE: 'banquet.manage',

  // Restricted Owner/Admin modules
  REVENUE_VIEW: 'revenue.view',
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_MANAGE: 'payroll.manage',
  BACKUP_MANAGE: 'backup.manage',
  SETTINGS_MANAGE: 'settings.manage',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  AI_MANAGE: 'ai.manage',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Standard role to permission mappings.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: Object.values(PERMISSIONS),
  SUPERADMIN: Object.values(PERMISSIONS),
  HOTEL_ADMIN: Object.values(PERMISSIONS),
  HOTEL_MANAGER: [
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.BOOKINGS_CANCEL,
    PERMISSIONS.FOLIO_VIEW,
    PERMISSIONS.FOLIO_CHARGE,
    PERMISSIONS.FOLIO_PAYMENT,
    PERMISSIONS.FOLIO_DISCOUNT_APPLY,
    PERMISSIONS.FOLIO_DISCOUNT_APPROVE,
    PERMISSIONS.POS_ORDER_CREATE,
    PERMISSIONS.POS_DAY_CLOSE,
    PERMISSIONS.HOUSEKEEPING_MANAGE,
    PERMISSIONS.MAINTENANCE_MANAGE,
    PERMISSIONS.SPA_MANAGE,
    PERMISSIONS.BANQUET_MANAGE,
    PERMISSIONS.REVENUE_VIEW,
  ],
  HOTEL_RECEPTIONIST: [
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.FOLIO_VIEW,
    PERMISSIONS.FOLIO_CHARGE,
    PERMISSIONS.FOLIO_PAYMENT,
    PERMISSIONS.POS_ORDER_CREATE,
    PERMISSIONS.HOUSEKEEPING_MANAGE,
  ],
  HOTEL_STAFF: [
    PERMISSIONS.HOUSEKEEPING_MANAGE,
  ],
};
