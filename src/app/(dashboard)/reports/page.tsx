'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export default function ReportsPage() {
  const { addToast } = useToast();

  const reports = [
    { name: 'Sales Report', icon: '📊', desc: 'Summary of all revenue generated.' },
    { name: 'Inventory Report', icon: '📦', desc: 'Current stock levels and valuation.' },
    { name: 'Audit Log', icon: '🛡️', desc: 'Track user activities and changes.' },
    { name: 'Tax Report', icon: '🏛️', desc: 'GST and other tax computations.' },
    { name: 'Guest History', icon: '👤', desc: 'Individual guest spending patterns.' },
    { name: 'Settlement Report', icon: '💳', desc: 'Breakdown of payment mode usage.' },
  ];

  const handleRunReport = (name: string) => {
    addToast('info', `Generating ${name}... (Data export ready soon)`);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports & Analytics" 
        description="Business performance data and statutory exports." 
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card 
            key={report.name} 
            className="hover:border-pos-primary/40 cursor-pointer transition-all duration-300 group p-6"
            onClick={() => handleRunReport(report.name)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-pos-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {report.icon}
                </div>
                <h3 className="font-black text-gray-900 group-hover:text-pos-primary transition-colors uppercase text-sm tracking-wider">
                  {report.name}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                  {report.desc}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-pos-primary group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
