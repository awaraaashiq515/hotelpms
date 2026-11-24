/**
 * tests/integration/rbac.spec.ts
 * WP-0.7: RBAC authorization tests
 * (SEC-01, ROLE-02, BAK-02, SPA-01, AGT-02, AIC-01, ADM-01, ADM-02, ADM-10)
 */
import { describe, it, expect } from 'vitest';
import { hasPermission, requirePermission, ForbiddenError } from '@/server/auth/rbac';
import { PERMISSIONS } from '@/server/auth/permissions';

describe('[SEC-01] Receptionist cannot access restricted permissions', () => {
  it('[SEC-01] Receptionist cannot access payroll', () => {
    expect(hasPermission('HOTEL_RECEPTIONIST', PERMISSIONS.PAYROLL_VIEW)).toBe(false);
    expect(() => requirePermission('HOTEL_RECEPTIONIST', PERMISSIONS.PAYROLL_VIEW)).toThrow(ForbiddenError);
  });

  it('[SEC-01] Receptionist cannot access backup management', () => {
    expect(hasPermission('HOTEL_RECEPTIONIST', PERMISSIONS.BACKUP_MANAGE)).toBe(false);
  });

  it('[SEC-01] Receptionist cannot access system settings', () => {
    expect(hasPermission('HOTEL_RECEPTIONIST', PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
  });

  it('[SEC-01] Receptionist cannot access user management', () => {
    expect(hasPermission('HOTEL_RECEPTIONIST', PERMISSIONS.USERS_MANAGE)).toBe(false);
  });

  it('[SEC-01] Receptionist cannot view sensitive revenue metrics', () => {
    expect(hasPermission('HOTEL_RECEPTIONIST', PERMISSIONS.REVENUE_VIEW)).toBe(false);
  });
});

describe('[SEC-01] Owner and Manager have proper permissions', () => {
  it('[SEC-01] Owner has full access to all modules', () => {
    expect(hasPermission('OWNER', PERMISSIONS.PAYROLL_VIEW)).toBe(true);
    expect(hasPermission('OWNER', PERMISSIONS.REVENUE_VIEW)).toBe(true);
    expect(hasPermission('OWNER', PERMISSIONS.BACKUP_MANAGE)).toBe(true);
  });

  it('[ROLE-02] Hotel Manager can approve discounts and view operations', () => {
    expect(hasPermission('HOTEL_MANAGER', PERMISSIONS.FOLIO_DISCOUNT_APPROVE)).toBe(true);
    expect(hasPermission('HOTEL_MANAGER', PERMISSIONS.BOOKINGS_CREATE)).toBe(true);
  });
});

describe('[SPA-01] Spa management permission check', () => {
  it('[SPA-01] Regular staff cannot access Spa Admin', () => {
    expect(hasPermission('HOTEL_STAFF', PERMISSIONS.SPA_MANAGE)).toBe(false);
  });
});

describe('[AIC-01] AI Concierge settings permission check', () => {
  it('[AIC-01] Receptionist cannot modify AI Concierge settings/keys', () => {
    expect(hasPermission('HOTEL_RECEPTIONIST', PERMISSIONS.AI_MANAGE)).toBe(false);
  });
});
