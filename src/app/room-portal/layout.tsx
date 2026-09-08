import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Room Portal — Hotel In-Room Tablet',
  description: 'Access room services, housekeeping, dining, and more from your in-room tablet.',
  robots: { index: false, follow: false },
};

export default function RoomPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#030712',
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'pan-y',
        overscrollBehavior: 'none',
      }}
    >
      {children}
    </div>
  );
}
