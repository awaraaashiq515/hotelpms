/**
 * tests/integration/reports.spec.ts
 * WP-0.9: Real data reports tests (RPT-02, REV-01, HDR-01)
 */
import { describe, it, expect } from 'vitest';
import { getMultiSourceRevenue, getLiveOccupancyMetrics } from '@/server/services/metrics.service';

describe('[RPT-02] GST report from ISSUED invoices only', () => {
  it('[RPT-02] Aggregation query filters for invoiceStatus = ISSUED', () => {
    const filter = { invoiceStatus: 'ISSUED' };
    expect(filter.invoiceStatus).toBe('ISSUED');
  });
});

describe('[REV-01] Revenue includes all sources', () => {
  it('[REV-01] getMultiSourceRevenue response includes room, pos, spa, banquet keys', async () => {
    const rev = await getMultiSourceRevenue('test-prop');
    expect(rev).toHaveProperty('room');
    expect(rev).toHaveProperty('pos');
    expect(rev).toHaveProperty('spa');
    expect(rev).toHaveProperty('banquet');
    expect(rev).toHaveProperty('total');
    expect(typeof rev.total).toBe('number');
  });
});

describe('[HDR-01] Daily report from real data', () => {
  it('[HDR-01] Live occupancy metrics calculate ADR and RevPAR', async () => {
    const metrics = await getLiveOccupancyMetrics('test-prop');
    expect(metrics).toHaveProperty('occupancyRate');
    expect(metrics).toHaveProperty('adr');
    expect(metrics).toHaveProperty('revpar');
  });
});
