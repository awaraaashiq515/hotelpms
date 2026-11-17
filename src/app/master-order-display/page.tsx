import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import MasterDisplayClient from './MasterDisplayClient';

export const dynamic = 'force-dynamic';

export default async function MasterOrderDisplayRootPage() {
  const session = await getSession();

  let propertyCode = session?.propertyCode || '';
  let propertyName = '';

  if (propertyCode) {
    const prop = await prisma.property.findFirst({
      where: { code: propertyCode },
      select: { name: true, code: true },
    });
    if (prop) {
      propertyName = prop.name;
    }
  }

  // Fallback to latest property
  if (!propertyCode) {
    const firstProp = await prisma.property.findFirst({
      select: { name: true, code: true },
      orderBy: { createdAt: 'desc' },
    });
    if (firstProp) {
      propertyCode = firstProp.code;
      propertyName = firstProp.name;
    }
  }

  return (
    <MasterDisplayClient
      propertyCode={propertyCode}
      initialPropertyName={propertyName}
    />
  );
}

