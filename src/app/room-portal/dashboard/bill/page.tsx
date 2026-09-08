'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Receipt, Hotel, UtensilsCrossed, CheckCircle2, AlertCircle } from 'lucide-react';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

export default function BillPage() {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('room_portal_token') || '';
    fetch('/api/room-portal/bill', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBill(d.data);
        else setError(d.message || 'Could not load bill.');
      })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number) =>
    `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Compute calculated totals by summing all transactions
  const charges = bill?.charges || [];
  const payments = bill?.payments || [];

  const totalCharges = charges.length > 0
    ? charges.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
    : (bill?.totalCharges || bill?.totalAmount || 0);

  const totalPayments = payments.length > 0
    ? payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
    : (bill?.totalPayments || bill?.advanceAmount || 0);

  const balanceDue = bill?.folioBalance !== undefined && bill?.folioBalance > 0
    ? bill.folioBalance
    : Math.max(0, totalCharges - totalPayments);

  // Categorize charges
  const roomCharges = charges.filter((c: any) =>
    (c.description || '').toLowerCase().includes('room rent') ||
    (c.description || '').toLowerCase().includes('room stay') ||
    c.type === 'ROOM_CHARGES'
  );
  const roomChargesTotal = roomCharges.length > 0
    ? roomCharges.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
    : (bill?.totalAmount || 0);

  const roomServiceCharges = charges.filter((c: any) => !roomCharges.includes(c));
  const roomServiceTotal = roomServiceCharges.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);

  // Validate check-in / check-out dates
  let checkInStr = '';
  let checkOutStr = '';
  if (bill) {
    const checkInDate = new Date(bill.arrivalDate);
    let checkOutDate = new Date(bill.departureDate);
    if (checkOutDate <= checkInDate) {
      checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 1);
    }
    checkInStr = checkInDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    checkOutStr = checkOutDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <DashboardSubpage title="My Bill" emoji="📄" accentColor="rgba(251,191,36,0.4)">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} color="rgb(99,102,241)" className="animate-spin" />
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgb(252,165,165)' }}>
          <p style={{ fontSize: '40px' }}>⚠️</p>
          <p style={{ fontWeight: 600 }}>{error}</p>
        </div>
      ) : bill ? (
        <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '40px' }}>

          {/* Summary Cards: Shows real total with all charges summed */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
            <BillSummaryCard
              label="Total Amount"
              value={formatCurrency(totalCharges)}
              color="white"
              bg="rgba(99,102,241,0.15)"
              border="rgba(99,102,241,0.35)"
              icon="💰"
            />
            <BillSummaryCard
              label="Paid"
              value={formatCurrency(totalPayments)}
              color="rgb(134,239,172)"
              bg="rgba(34,197,94,0.1)"
              border="rgba(34,197,94,0.3)"
              icon="✅"
            />
            <BillSummaryCard
              label="Balance Due"
              value={formatCurrency(balanceDue)}
              color={balanceDue > 0 ? '#fca5a5' : '#86efac'}
              bg={balanceDue > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)'}
              border={balanceDue > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.3)'}
              icon={balanceDue > 0 ? '⏳' : '🎉'}
            />
          </div>

          {/* Booking Info Card */}
          <div style={{
            background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '18px', padding: '20px 24px', marginBottom: '24px',
            display: 'flex', gap: '24px', flexWrap: 'wrap',
          }}>
            <InfoItem label="Booking No." value={bill.bookingNo} />
            <InfoItem label="Check-in" value={checkInStr} />
            <InfoItem label="Check-out" value={checkOutStr} />
            <InfoItem label="Meal Plan" value={bill.mealPlan || 'Room Only (RO)'} />
          </div>

          {/* Complete Bill Breakdown Card (Pura Bill Jod Kar) */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(15,23,42,0.95) 100%)',
            border: '1.5px solid rgba(99,102,241,0.35)',
            borderRadius: '22px', padding: '24px', marginBottom: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.35)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>🧾</span>
                <div>
                  <h3 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: 900 }}>
                    Complete Bill Summary
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>
                    Itemized total of all room stay &amp; service charges
                  </p>
                </div>
              </div>
              <span style={{
                background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
                color: '#a5b4fc', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px'
              }}>
                {charges.length} {charges.length === 1 ? 'Charge' : 'Charges'}
              </span>
            </div>

            {/* Breakdown line items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {/* Room Rent */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#cbd5e1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏨</span> Room Rent &amp; Stay
                </span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>
                  {formatCurrency(roomChargesTotal)}
                </span>
              </div>

              {/* Room Service / Food Orders */}
              {roomServiceTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#cbd5e1' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🍽️</span> Room Service Orders ({roomServiceCharges.length})
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>
                    + {formatCurrency(roomServiceTotal)}
                  </span>
                </div>
              )}

              {/* Gross Total */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '14px', fontWeight: 800, color: '#ffffff',
                paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)'
              }}>
                <span>Total Bill Amount</span>
                <span style={{ color: '#ffffff' }}>{formatCurrency(totalCharges)}</span>
              </div>

              {/* Payments / Advance */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#86efac' }}>
                <span>Less: Advance &amp; Payments Received</span>
                <span>- {formatCurrency(totalPayments)}</span>
              </div>
            </div>

            {/* Net Balance Due Box */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', borderRadius: '16px',
              background: balanceDue > 0 ? 'rgba(249,115,22,0.15)' : 'rgba(34,197,94,0.15)',
              border: `1.5px solid ${balanceDue > 0 ? 'rgba(249,115,22,0.4)' : 'rgba(34,197,94,0.4)'}`,
              marginTop: '12px'
            }}>
              <div>
                <p style={{ margin: 0, color: '#ffffff', fontSize: '15px', fontWeight: 900 }}>
                  {balanceDue > 0 ? 'Net Balance Due' : 'Bill Fully Settled'}
                </p>
                <p style={{ margin: '3px 0 0', color: balanceDue > 0 ? '#fdba74' : '#86efac', fontSize: '11px', fontWeight: 600 }}>
                  {balanceDue > 0 ? 'Payable upon checkout at hotel front desk' : 'No pending balance due'}
                </p>
              </div>
              <p style={{ margin: 0, color: balanceDue > 0 ? '#fb923c' : '#4ade80', fontSize: '26px', fontWeight: 900 }}>
                {formatCurrency(balanceDue)}
              </p>
            </div>
          </div>

          {/* Charges Itemized List */}
          {charges.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <TrendingUp size={16} color="rgb(252,165,165)" />
                <p style={{ color: 'rgb(148,163,184)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>
                  Transaction History &amp; Charges
                </p>
              </div>
              <div style={{
                background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '18px', overflow: 'hidden'
              }}>
                {charges.map((c: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>{c.description}</p>
                      <p style={{ color: 'rgb(148,163,184)', fontSize: '11px', margin: '3px 0 0' }}>{formatDate(c.date)}</p>
                    </div>
                    <p style={{ color: '#fca5a5', fontWeight: 800, fontSize: '15px', margin: 0 }}>
                      + {formatCurrency(c.amount)}
                    </p>
                  </div>
                ))}

                {/* Charges Footer Total Row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', background: 'rgba(239,68,68,0.06)',
                }}>
                  <div>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>Total Charges</span>
                    <span style={{ color: 'rgb(148,163,184)', fontSize: '12px', marginLeft: '8px' }}>({charges.length} items)</span>
                  </div>
                  <span style={{ color: '#fca5a5', fontWeight: 900, fontSize: '17px' }}>
                    + {formatCurrency(totalCharges)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payments Received List */}
          {payments.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <TrendingDown size={16} color="rgb(134,239,172)" />
                <p style={{ color: 'rgb(148,163,184)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>
                  Payments Received
                </p>
              </div>
              <div style={{
                background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '18px', overflow: 'hidden'
              }}>
                {payments.map((p: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>{p.description}</p>
                      <p style={{ color: 'rgb(148,163,184)', fontSize: '11px', margin: '3px 0 0' }}>{formatDate(p.date)}</p>
                    </div>
                    <p style={{ color: '#86efac', fontWeight: 800, fontSize: '15px', margin: 0 }}>
                      - {formatCurrency(p.amount)}
                    </p>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', background: 'rgba(34,197,94,0.06)',
                }}>
                  <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>Total Payments</span>
                  <span style={{ color: '#86efac', fontWeight: 900, fontSize: '17px' }}>
                    - {formatCurrency(totalPayments)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {charges.length === 0 && payments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgb(100,116,139)' }}>
              <p style={{ fontSize: '32px' }}>📋</p>
              <p>No transactions recorded yet. Your charges will appear here.</p>
            </div>
          )}

          <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
            For billing queries or checkout settlement, please contact the front desk.
          </p>
        </div>
      ) : null}
    </DashboardSubpage>
  );
}

function BillSummaryCard({ label, value, color, bg, border, icon }: any) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '18px', padding: '20px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: '24px', margin: '0 0 8px 0' }}>{icon}</p>
      <p style={{ color: 'rgb(148,163,184)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 6px 0' }}>{label}</p>
      <p style={{ color, fontSize: '20px', fontWeight: 900, margin: 0 }}>{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: '120px' }}>
      <p style={{ color: 'rgb(100,116,139)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px 0' }}>{label}</p>
      <p style={{ color: 'white', fontSize: '14px', fontWeight: 800, margin: 0 }}>{value}</p>
    </div>
  );
}
