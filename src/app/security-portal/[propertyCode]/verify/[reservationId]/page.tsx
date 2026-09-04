import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ propertyCode: string; reservationId: string }>
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDateTime(d: string | Date) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function nights(a: Date | string, b: Date | string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)))
}

const STATUS_CONFIG = {
  VALID:     { label: 'VALID — Checked In',         color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  icon: '✅', desc: 'Guest is actively checked in. Entry permitted.' },
  CONFIRMED: { label: 'CONFIRMED — Not Checked In', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)',  icon: '🟡', desc: 'Booking confirmed. Guest has not checked in yet.' },
  EXPIRED:   { label: 'EXPIRED — Checked Out',      color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   icon: '❌', desc: 'Guest has already checked out.' },
  CANCELLED: { label: 'CANCELLED',                  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: '🚫', desc: 'This booking was cancelled.' },
  INVALID:   { label: 'INVALID QR',                 color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   icon: '❌', desc: 'This QR code was not found in the system.' },
}

export default async function VerifyPage({ params }: Params) {
  const { reservationId, propertyCode } = await params

  // Fetch reservation data server-side (fast, no auth needed)
  let verificationStatus: keyof typeof STATUS_CONFIG = 'INVALID'
  let reservation: any = null
  let guest: any = null
  let property: any = null
  let roomNumber: string | null = null
  let floorLabel: string | null = null

  try {
    const res = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: {
          select: {
            firstName: true,
            lastName: true,
            mobile: true,
            email: true,
            idType: true,
            idNumber: true,
            nationality: true,
          },
        },
        roomType: { select: { name: true } },
        rooms: {
          include: {
            room: { select: { roomNumber: true, floor: true } },
          },
        },
        checkIns: {
          where: { status: 'ACTIVE' },
          select: { checkedInAt: true, expectedCheckoutAt: true },
        },
        property: {
          select: { name: true, brandName: true, logoUrl: true, phone: true, address: true, code: true },
        },
      },
    })

    if (res) {
      reservation = res
      guest = res.guest
      property = res.property
      roomNumber = res.rooms?.[0]?.room?.roomNumber || null
      floorLabel = res.rooms?.[0]?.room?.floor ? `Floor ${res.rooms[0].room.floor}` : null

      if (res.status === 'CHECKED_IN') verificationStatus = 'VALID'
      else if (res.status === 'CONFIRMED' || res.status === 'PENDING') verificationStatus = 'CONFIRMED'
      else if (res.status === 'CHECKED_OUT') verificationStatus = 'EXPIRED'
      else if (res.status === 'CANCELLED') verificationStatus = 'CANCELLED'
      else verificationStatus = 'INVALID'
    }
  } catch (e) {
    console.error('[VerifyPage]', e)
  }

  const cfg = STATUS_CONFIG[verificationStatus]
  const nightCount = reservation ? nights(reservation.arrivalDate, reservation.departureDate) : 0
  const checkInRecord = reservation?.checkIns?.[0]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080b12',
      color: '#e2e8f0',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a,#1e1b4b)',
        borderBottom: '1px solid rgba(99,102,241,0.2)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {property?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={property.logoUrl} alt="Logo" style={{ height: 36, width: 36, objectFit: 'contain', borderRadius: 8 }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            🛡️
          </div>
        )}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>
            {property?.brandName || property?.name || 'Hotel'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.06em' }}>
            BOOKING VERIFICATION
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        {/* Status Banner */}
        <div style={{
          background: cfg.bg,
          border: `2px solid ${cfg.border}`,
          borderRadius: 18,
          padding: '24px 20px',
          textAlign: 'center',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{cfg.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: cfg.color, letterSpacing: '0.03em', marginBottom: 6 }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{cfg.desc}</div>
        </div>

        {/* Guest Info */}
        {guest && (
          <div style={{
            background: '#0d1117',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#475569', marginBottom: 10 }}>GUEST INFORMATION</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', marginBottom: 6 }}>
              {guest.firstName} {guest.lastName || ''}
            </div>
            {guest.mobile && (
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                📞 {guest.mobile}
              </div>
            )}
            {guest.email && (
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>✉️ {guest.email}</div>
            )}
            {guest.idType && guest.idNumber && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px', display: 'inline-block' }}>
                🪪 {guest.idType}: {guest.idNumber}
              </div>
            )}
          </div>
        )}

        {/* Booking Details */}
        {reservation && (
          <div style={{
            background: '#0d1117',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            overflow: 'hidden',
            marginBottom: 12,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#475569', marginBottom: 4 }}>BOOKING DETAILS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>{reservation.bookingNo}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
              {[
                { label: 'Room', value: roomNumber ? `${roomNumber}${floorLabel ? ` · ${floorLabel}` : ''}` : '—', icon: '🛏️' },
                { label: 'Room Type', value: reservation.roomType?.name || '—', icon: '✨' },
                { label: 'Check-In', value: checkInRecord ? fmtDateTime(checkInRecord.checkedInAt) : fmtDate(reservation.arrivalDate), icon: '📅' },
                { label: 'Check-Out', value: fmtDate(reservation.departureDate), icon: '📅' },
                { label: 'Duration', value: `${nightCount} Night${nightCount > 1 ? 's' : ''}`, icon: '🌙' },
                { label: 'Guests', value: `${reservation.adults} Adult${reservation.adults > 1 ? 's' : ''}${reservation.children > 0 ? ` + ${reservation.children} Child` : ''}`, icon: '👥' },
                { label: 'Meal Plan', value: reservation.mealPlan || 'RO', icon: '🍽️' },
                { label: 'Pool Access', value: reservation.poolAccess ? '✓ Included' : 'Not Included', icon: '🏊' },
                { label: 'Total Amount', value: `₹${reservation.totalAmount?.toLocaleString('en-IN')}`, icon: '💳' },
                { label: 'Due Amount', value: reservation.dueAmount > 0 ? `₹${reservation.dueAmount?.toLocaleString('en-IN')}` : 'Fully Paid', icon: '💰' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ background: '#0d1117', padding: '10px 14px' }}
                >
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>
                    {item.icon} {item.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {reservation.addOnNotes && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>📝 ADD-ON NOTES</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{reservation.addOnNotes}</div>
              </div>
            )}
          </div>
        )}

        {/* Spa / Pool Packages */}
        {reservation && (reservation.poolPackage !== 'NONE' || reservation.spaPackage !== 'NONE') && (
          <div style={{
            background: '#0d1117',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#475569', marginBottom: 8 }}>PACKAGES & ADD-ONS</div>
            {reservation.poolPackage && reservation.poolPackage !== 'NONE' && (
              <div style={{ fontSize: 13, color: '#818cf8', marginBottom: 4 }}>🏊 Pool: {reservation.poolPackage}</div>
            )}
            {reservation.spaPackage && reservation.spaPackage !== 'NONE' && (
              <div style={{ fontSize: 13, color: '#818cf8' }}>💆 Spa: {reservation.spaPackage}</div>
            )}
          </div>
        )}

        {/* Property Contact */}
        {property?.phone && (
          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>For assistance, contact</div>
            <a href={`tel:${property.phone}`} style={{ fontSize: 14, color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
              📞 {property.phone}
            </a>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 10, color: '#1e293b' }}>
          Verified via GustFlow HMS · {new Date().toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  )
}
