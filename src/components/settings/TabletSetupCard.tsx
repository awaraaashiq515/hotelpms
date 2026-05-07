'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tablet, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const TabletSetupCard = () => {
  return (
    <Card className="p-8 border-l-[6px] border-l-pos-primary group hover:shadow-2xl transition-all duration-500">
      <div className="flex items-start gap-6">
        <div className="bg-pos-primary/10 p-5 rounded-[1.5rem] text-pos-primary group-hover:scale-110 transition-transform">
          <Tablet size={32} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Tablet Ordering System</h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-tight leading-relaxed mb-6">
            Configure Waiter and Table modes for your Android/iOS devices. Manage device assignments and real-time tracking.
          </p>
          <Link href="/settings/tablets">
            <Button className="w-full bg-pos-primary hover:bg-pos-primary-dark text-white font-black tracking-widest py-4 rounded-xl shadow-xl shadow-pos-primary/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              MANAGE DEVICES <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
