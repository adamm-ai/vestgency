import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seed...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@vestate.ai';
  const adminPassword = process.env.ADMIN_PASSWORD || 'vestate2024';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Admin Vestate',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log(`[Seed] Admin user created: ${admin.email}`);
  } else {
    console.log(`[Seed] Admin user already exists: ${existingAdmin.email}`);
  }

  // Create a demo agent
  const agentEmail = 'agent@vestate.ai';
  const existingAgent = await prisma.user.findUnique({
    where: { email: agentEmail },
  });

  if (!existingAgent) {
    const hashedPassword = await bcrypt.hash('agent2024', 12);

    const agent = await prisma.user.create({
      data: {
        email: agentEmail,
        password: hashedPassword,
        fullName: 'Agent Demo',
        role: 'AGENT',
        isActive: true,
      },
    });

    console.log(`[Seed] Demo agent created: ${agent.email}`);
  }

  // Create sample leads
  const leadCount = await prisma.lead.count();
  if (leadCount === 0) {
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });

    const sampleLeads = [
      {
        firstName: 'Mohammed',
        lastName: 'El Amrani',
        email: 'mohammed.amrani@gmail.com',
        phone: '+212 6 12 34 56 78',
        city: 'Casablanca',
        status: 'NEW' as const,
        source: 'WEBSITE_FORM' as const,
        urgency: 'HIGH' as const,
        transactionType: 'SALE' as const,
        budgetMin: BigInt(2000000),
        budgetMax: BigInt(4000000),
        score: 75,
        createdById: admin?.id,
      },
      {
        firstName: 'Fatima',
        lastName: 'Benali',
        email: 'fatima.benali@outlook.com',
        phone: '+212 6 98 76 54 32',
        city: 'Marrakech',
        status: 'CONTACTED' as const,
        source: 'CHATBOT' as const,
        urgency: 'MEDIUM' as const,
        transactionType: 'RENT' as const,
        budgetMin: BigInt(8000),
        budgetMax: BigInt(15000),
        score: 65,
        createdById: admin?.id,
      },
      {
        firstName: 'Youssef',
        lastName: 'Tazi',
        email: 'ytazi@entreprise.ma',
        phone: '+212 6 55 44 33 22',
        city: 'Rabat',
        status: 'QUALIFIED' as const,
        source: 'REFERRAL' as const,
        urgency: 'CRITICAL' as const,
        transactionType: 'SALE' as const,
        budgetMin: BigInt(5000000),
        budgetMax: BigInt(10000000),
        score: 90,
        createdById: admin?.id,
      },
    ];

    for (const lead of sampleLeads) {
      await prisma.lead.create({ data: lead });
    }

    console.log(`[Seed] ${sampleLeads.length} sample leads created`);
  }

  console.log('[Seed] Database seed completed!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
