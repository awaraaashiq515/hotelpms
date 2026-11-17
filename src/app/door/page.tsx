'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function DoorRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const room = searchParams?.get('room') || searchParams?.get('roomNumber') || '';
    const propCode = searchParams?.get('propertyCode') || searchParams?.get('property') || 'hotel';

    if (room) {
      router.replace(`/door/${encodeURIComponent(propCode.toLowerCase())}/${encodeURIComponent(room)}`);
    } else {
      router.replace('/hotel');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white">
      <div className="flex items-center gap-2">
        <Loader2 size={18} className="animate-spin text-indigo-400" />
        <span className="text-sm font-bold text-slate-300">Loading Room Door Concierge...</span>
      </div>
    </div>
  );
}

export default function DoorRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    }>
      <DoorRedirectContent />
    </Suspense>
  );
}
