import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('DemoMerchant123!', 10);

  const merchant = await prisma.merchant.upsert({
    where: { email: 'demo@fluxapay.com' },
    update: {},
    create: {
      businessName: 'FluxaPay Demo Store',
      email: 'demo@fluxapay.com',
      passwordHash,
      role: 'MERCHANT',
      fiatSettlementCurrency: 'USD',
      isVerified: true,
      apiKeys: {
        create: {
          name: 'Primary Development Key',
          keyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          maskedKey: 'flx_live_...b855',
          status: 'ACTIVE',
        },
      },
    },
  });

  console.log(`Demo merchant seeded successfully: ${merchant.businessName} (${merchant.id})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
