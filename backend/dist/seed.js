"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
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
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 12);
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
    }
    else {
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
            const hashedPassword = await bcryptjs_1.default.hash(agentPassword, 12);
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
        }
        else {
            console.log(`   → Agent exists: ${existingAgent.email}`);
        }
    }
    else {
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
            status: 'NEW',
            source: 'WEBSITE_FORM',
            urgency: 'HIGH',
            transactionType: 'SALE',
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
            status: 'CONTACTED',
            source: 'CHATBOT',
            urgency: 'MEDIUM',
            transactionType: 'RENT',
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
            status: 'QUALIFIED',
            source: 'REFERRAL',
            urgency: 'CRITICAL',
            transactionType: 'SALE',
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
    let propertiesData = null;
    let usedPath = '';
    for (const filePath of possiblePaths) {
        try {
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, 'utf-8');
                propertiesData = JSON.parse(raw);
                usedPath = filePath;
                break;
            }
        }
        catch (e) {
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
                const cleanImages = (prop.images || []).filter((img) => img.includes('/ad/') &&
                    !img.includes('banner') &&
                    !img.includes('logo') &&
                    !img.includes('assets'));
                await prisma.property.create({
                    data: {
                        externalId: prop.id,
                        name: prop.name,
                        type: prop.type || 'Appartement',
                        category: prop.category,
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
            }
            catch (e) {
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
//# sourceMappingURL=seed.js.map