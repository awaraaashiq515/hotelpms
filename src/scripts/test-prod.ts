import { signWTToken } from '../lib/walkie-talkie-auth';
import { prisma } from '../lib/prisma';

async function main() {
  const userId = 'cmpz9to6400039bhhkme3nno2'; // rahul's ID
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    console.error('User not found');
    return;
  }

  // Generate walkie-talkie token for Rahul
  const wtToken = await signWTToken(user.id, user.phone || '');
  console.log('Generated wtToken for Rahul:', wtToken);

  // Construct request URL
  const url = `http://localhost:3000/api/pos-orders?propertyId=${user.propertyId}&status=in_progress`;
  console.log('Sending request to:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${wtToken}`,
      'cache': 'no-store'
    }
  });

  console.log('Response status:', response.status);
  const body = await response.json();
  console.log('Response body keys:', Object.keys(body));
  if (body.success) {
    console.log('Orders found:', body.data.length);
    body.data.forEach((o: any) => {
      console.log(`- Order: ${o.orderNo}, status: ${o.status}, table: ${o.table?.name}`);
    });
  } else {
    console.error('Failed:', body);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
