
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const assets = await prisma.asset.findMany({
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${assets.length} assets. Re-ordering...`);

    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        await prisma.asset.update({
            where: { id: asset.id },
            data: { order: i + 1 }
        });
        console.log(`Updated ${asset.name} to order ${i + 1}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
