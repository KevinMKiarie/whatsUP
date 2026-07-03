import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.upsert({
    where:  { phone: '254700000000' },
    update: {},
    create: {
      name:     'Glow Studio',
      slug:     'glow-studio',
      phone:    '254700000000',
      category: 'salon',
      services: {
        create: [
          { name: 'Haircut & Blow-dry', durationMinutes: 60,  price: 1500 },
          { name: 'Full Facial',        durationMinutes: 90,  price: 2500 },
          { name: 'Manicure',           durationMinutes: 45,  price: 800  },
          { name: 'Pedicure',           durationMinutes: 60,  price: 1000 },
        ],
      },
    },
  });

  const services = await prisma.service.findMany({ where: { businessId: business.id } });

  console.log(`Seeded business: ${business.name} (phone: ${business.phone})`);
  console.log(`Services: ${services.map((s) => s.name).join(', ')}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
