'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, BadgeCheck } from 'lucide-react';

interface UploadInstructionsCardProps {
  filingId: string | null;
  handleMarkSubmitted: (id: string) => Promise<void>;
  setStep: (s: 1 | 2 | 3) => void;
}

export function UploadInstructionsCard({
  filingId,
  handleMarkSubmitted,
  setStep,
}: UploadInstructionsCardProps) {
  return (
    <Card className="p-8 border-l-4 border-l-emerald-400">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle2 className="text-emerald-500" size={24} />
        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">JSON Downloaded! Now Upload to GST Portal</h2>
      </div>
      <ol className="space-y-2 text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
        <li className="flex items-start gap-2"><span className="text-pos-primary font-black">1.</span> Login to gst.gov.in</li>
        <li className="flex items-start gap-2"><span className="text-pos-primary font-black">2.</span> Go to Services → Returns → Returns Dashboard</li>
        <li className="flex items-start gap-2"><span className="text-pos-primary font-black">3.</span> Under GSTR-1, click "Upload JSON"</li>
        <li className="flex items-start gap-2"><span className="text-pos-primary font-black">4.</span> Select the downloaded file and submit</li>
        <li className="flex items-start gap-2"><span className="text-pos-primary font-black">5.</span> After successful upload, click "Mark as Submitted" below</li>
      </ol>
      {filingId && (
        <Button
          id="mark-submitted-btn"
          onClick={async () => {
            await handleMarkSubmitted(filingId);
            setStep(1);
          }}
          className="mt-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black tracking-widest px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <BadgeCheck size={16} />
          Mark as Submitted
        </Button>
      )}
    </Card>
  );
}
