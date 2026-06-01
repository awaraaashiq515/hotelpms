'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { CustomerProfileTabs } from './profile-tabs';

export default function CustomerProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Guest Profile" 
        subtitle="Detailed Relationship Management"
        showBack
        backUrl="/customers"
      />
      <CustomerProfileTabs customerId={id} />
    </div>
  );
}
