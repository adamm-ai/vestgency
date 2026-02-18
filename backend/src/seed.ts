import { PrismaClient, PropertyCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

interface ScrapedProperty {
  id: string;
  name: string;
  type: string;
  category: 'SALE' | 'RENT';
  location: string;
  city: string;
  price: string;
  priceNumeric: number;
  beds: number;
  baths: number;
  area: string;
  areaNumeric: number;
  image: string;
  images: string[];
  features: string[];
  smartTags: string[];
  description: string;
  url: string;
  datePublished: string | null;
  dateScraped: string;
}

interface PropertiesData {
  metadata: {
    totalProperties: number;
    saleCount: number;
    rentCount: number;
    source: string;
    agency: string;
    scrapedAt: string;
  };
  properties: ScrapedProperty[];
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedUsers() {
  console.log('\n📋 Seeding users...');

  // Create admin user - REQUIRE environment variables
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('   ❌ ADMIN_EMAIL et ADMIN_PASSWORD doivent être configurés');
    console.error('   → Configurez ces variables dans Render Dashboard ou .env');
    throw new Error('Variables d\'environnement ADMIN_EMAIL/ADMIN_PASSWORD manquantes');
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Admin At Home',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`   ✓ Admin created: ${admin.email}`);
  } else {
    console.log(`   → Admin exists: ${existingAdmin.email}`);
  }

  // Create demo agent (optional - only if AGENT_EMAIL is provided)
  const agentEmail = process.env.AGENT_EMAIL;
  const agentPassword = process.env.AGENT_PASSWORD;

  if (agentEmail && agentPassword) {
    const existingAgent = await prisma.user.findUnique({
      where: { email: agentEmail },
    });

    if (!existingAgent) {
      const hashedPassword = await bcrypt.hash(agentPassword, 12);
      const agent = await prisma.user.create({
        data: {
          email: agentEmail,
          password: hashedPassword,
          fullName: 'Agent At Home',
          role: 'AGENT',
          isActive: true,
        },
      });
      console.log(`   ✓ Agent created: ${agent.email}`);
    } else {
      console.log(`   → Agent exists: ${existingAgent.email}`);
    }
  } else {
    console.log('   → Agent demo non créé (AGENT_EMAIL/AGENT_PASSWORD non configurés)');
  }
}

async function seedLeads() {
  console.log('\n📋 Seeding sample leads...');

  const leadCount = await prisma.lead.count();
  if (leadCount > 0) {
    console.log(`   → ${leadCount} leads already exist, skipping`);
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

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
      city: 'Tanger',
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
      city: 'Casablanca',
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

  console.log(`   ✓ ${sampleLeads.length} sample leads created`);
}

async function seedProperties() {
  console.log('\n🏠 Seeding properties from Mubawab scrape...');

  // Find the properties.json file
  const possiblePaths = [
    path.join(__dirname, '../../data/properties.json'),
    path.join(__dirname, '../../../data/properties.json'),
    path.join(process.cwd(), 'data/properties.json'),
    path.join(process.cwd(), '../data/properties.json'),
  ];

  let propertiesData: PropertiesData | null = null;
  let usedPath = '';

  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        propertiesData = JSON.parse(raw);
        usedPath = filePath;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!propertiesData || !propertiesData.properties?.length) {
    console.log('   ⚠ No properties.json found or empty, skipping');
    return;
  }

  console.log(`   📂 Found: ${usedPath}`);
  console.log(`   📊 Source: ${propertiesData.metadata.source}`);
  console.log(`   📊 Agency: ${propertiesData.metadata.agency}`);
  console.log(`   📊 Total properties: ${propertiesData.metadata.totalProperties}`);

  // Clear existing properties (fresh import)
  const existingCount = await prisma.property.count();
  if (existingCount > 0) {
    console.log(`   🗑️  Clearing ${existingCount} existing properties...`);
    await prisma.property.deleteMany({});
  }

  // Insert properties in batches
  const batchSize = 10;
  const properties = propertiesData.properties;
  let inserted = 0;
  let errors = 0;

  console.log(`   📥 Inserting ${properties.length} properties...`);

  for (let i = 0; i < properties.length; i += batchSize) {
    const batch = properties.slice(i, i + batchSize);

    for (const prop of batch) {
      try {
        // Filter out banner/logo images
        const cleanImages = (prop.images || []).filter(
          (img: string) =>
            img.includes('/ad/') &&
            !img.includes('banner') &&
            !img.includes('logo') &&
            !img.includes('assets')
        );

        await prisma.property.create({
          data: {
            externalId: prop.id,
            name: prop.name,
            type: prop.type || 'Appartement',
            category: prop.category as PropertyCategory,
            price: prop.price || 'Prix sur demande',
            priceNumeric: BigInt(prop.priceNumeric || 0),
            location: prop.location || 'Casablanca',
            city: prop.city || 'Casablanca',
            beds: prop.beds || 0,
            baths: prop.baths || 0,
            area: prop.area || '',
            areaNumeric: prop.areaNumeric || 0,
            image: cleanImages[0] || prop.image || null,
            images: cleanImages.length > 0 ? cleanImages : [prop.image].filter(Boolean),
            features: prop.features || [],
            smartTags: prop.smartTags || [],
            description: prop.description || null,
            url: prop.url || null,
            source: 'mubawab',
            dateScraped: prop.dateScraped ? new Date(prop.dateScraped) : new Date(),
            isActive: true,
            isFeatured: false,
          },
        });
        inserted++;
      } catch (e) {
        errors++;
        console.error(`   ✗ Error inserting ${prop.name}:`, e);
      }
    }

    // Progress indicator
    const progress = Math.min(i + batchSize, properties.length);
    process.stdout.write(`\r   📥 Progress: ${progress}/${properties.length}`);
  }

  console.log(''); // New line after progress
  console.log(`   ✓ Inserted: ${inserted} properties`);
  if (errors > 0) {
    console.log(`   ✗ Errors: ${errors}`);
  }

  // Set some properties as featured
  const featuredCount = Math.min(6, inserted);
  await prisma.property.updateMany({
    where: {
      type: { in: ['Villa', 'Appartement'] },
    },
    data: { isFeatured: false },
  });

  // Get random properties to feature
  const allProps = await prisma.property.findMany({
    take: featuredCount,
    orderBy: { createdAt: 'desc' },
  });

  for (const prop of allProps) {
    await prisma.property.update({
      where: { id: prop.id },
      data: { isFeatured: true },
    });
  }

  console.log(`   ⭐ ${featuredCount} properties marked as featured`);
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE SUMMARY');
  console.log('='.repeat(60));

  const userCount = await prisma.user.count();
  const leadCount = await prisma.lead.count();
  const propertyCount = await prisma.property.count();
  const saleCount = await prisma.property.count({ where: { category: 'SALE' } });
  const rentCount = await prisma.property.count({ where: { category: 'RENT' } });
  const featuredCount = await prisma.property.count({ where: { isFeatured: true } });

  console.log(`   Users:      ${userCount}`);
  console.log(`   Leads:      ${leadCount}`);
  console.log(`   Properties: ${propertyCount}`);
  console.log(`     - SALE:     ${saleCount}`);
  console.log(`     - RENT:     ${rentCount}`);
  console.log(`     - Featured: ${featuredCount}`);
  console.log('='.repeat(60));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       AT HOME REAL ESTATE - DATABASE SEED                    ║');
  console.log('║       Injecting scraped properties into PostgreSQL           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await seedUsers();
  await seedLeads();
  await seedProperties();
  await printSummary();

  console.log('\n✅ Database seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
