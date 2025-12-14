import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCurrencies() {
    console.log('🌍 Seeding currencies...');

    const currencies = [
        {
            code: 'USD',
            name: 'Dólar estadounidense',
            symbol: '$',
            decimal_places: 2,
            exchange_rate_to_usd: 1.0,
            is_active: true,
        },
        {
            code: 'CLP',
            name: 'Peso chileno',
            symbol: '$',
            decimal_places: 0,
            exchange_rate_to_usd: 950.0, // Approx rate, update  as needed
            is_active: true,
        },
        {
            code: 'UF',
            name: 'Unidad de Fomento',
            symbol: 'UF',
            decimal_places: 2,
            exchange_rate_to_usd: 0.035, // Approx UF ~37,000 CLP, USD/CLP ~950
            is_active: true,
        },
    ];

    for (const currency of currencies) {
        await prisma.currency.upsert({
            where: { code: currency.code },
            update: currency,
            create: currency,
        });
        console.log(`✓ ${currency.code} - ${currency.name}`);
    }

    console.log('✅ Currencies seeded successfully!');
}

async function main() {
    try {
        await seedCurrencies();
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
