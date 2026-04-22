const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany();
  console.log('Properties:', properties.map(p => ({ id: p.id, name: p.name, code: p.code })));
  
  // If code is null or empty, we need to fix it
  for (const p of properties) {
    const cleanCode = p.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (p.code !== cleanCode) {
      // Append a small part of ID to ensure uniqueness
      const finalCode = `${cleanCode}-${p.id.slice(-4)}`;
      await prisma.property.update({
        where: { id: p.id },
        data: { code: finalCode }
      });
      console.log(`Updated property ${p.name} with unique code: ${finalCode}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
