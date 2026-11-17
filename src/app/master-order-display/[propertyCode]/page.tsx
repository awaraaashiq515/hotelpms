import { prisma } from '@/lib/prisma';
import MasterDisplayClient from '../MasterDisplayClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ propertyCode: string }>;
}

export default async function MasterOrderDisplayPropertyPage({ params }: PageProps) {
  const { propertyCode } = await params;
  const cleanCode = (propertyCode || '').toUpperCase();

  const prop = await prisma.property.findFirst({
    where: {
      OR: [
        { code: cleanCode },
        { code: cleanCode.toLowerCase() },
      ],
    },
    select: { name: true, code: true },
  });

  return (
    <MasterDisplayClient
      propertyCode={cleanCode}
      initialPropertyName={prop?.name || cleanCode}
    />
  );
}

