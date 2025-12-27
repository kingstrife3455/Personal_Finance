
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugReordering() {
    console.log("--- Debugging Reordering ---");
    // 1. Create dummy assets
    await prisma.asset.deleteMany({}); // clear
    await prisma.asset.create({ data: { name: 'A', order: 0 } });
    await prisma.asset.create({ data: { name: 'B', order: 0 } });
    await prisma.asset.create({ data: { name: 'C', order: 0 } });

    // 2. Fetch and show
    let assets = await prisma.asset.findMany({ orderBy: { order: 'asc' } });
    console.log("Initial state:", assets.map(a => `${a.name}(${a.order})`));

    // 3. Emulate Move Logic (Move 'B' Up)
    // Find B
    const idToMove = assets.find(a => a.name === 'B')?.id;
    if (!idToMove) return console.error("B not found");

    console.log("Moving B UP");

    // LOGIC FROM ACTION
    const currentAssets = await prisma.asset.findMany({ orderBy: { order: 'asc' } });
    const currentIndex = currentAssets.findIndex(a => a.id === idToMove);

    if (currentIndex > -1) {
        const newAssets = [...currentAssets];
        // Swap with prev
        if (currentIndex > 0) {
            [newAssets[currentIndex], newAssets[currentIndex - 1]] = [newAssets[currentIndex - 1], newAssets[currentIndex]];
        }

        // Save
        for (let i = 0; i < newAssets.length; i++) {
            await prisma.asset.update({
                where: { id: newAssets[i].id },
                data: { order: i + 1 }
            });
        }
    }

    // 4. Fetch and show
    assets = await prisma.asset.findMany({ orderBy: { order: 'asc' } });
    console.log("After Move Up:", assets.map(a => `${a.name}(${a.order})`));
}

async function debugDateLogic() {
    console.log("\n--- Debugging Date Logic ---");
    // Clear records
    await prisma.assetRecord.deleteMany({});

    const asset = await prisma.asset.findFirst();
    if (!asset) return console.log("No asset to test");

    // Emulate "March" (Index 2)
    const year = 2025;
    const monthIndex = 2; // March
    const value = 100;

    // LOGIC FROM ACTION
    // const recordMonth = new Date(Date.UTC(year, monthIndex, 1));
    // Proposed fix logic
    const utcDate = new Date(Date.UTC(year, monthIndex, 1));
    console.log(`Saving for ${year}-${monthIndex + 1} (March). Constructed UTC Date: ${utcDate.toISOString()}`);

    await prisma.assetRecord.create({
        data: {
            assetId: asset.id,
            month: utcDate,
            value: value
        }
    });

    // Verify Read
    const record = await prisma.assetRecord.findFirst({
        where: { assetId: asset.id }
    });

    if (record) {
        console.log(`Retrieved Record Month (DB object):`, record.month);
        console.log(`Retrieved Record Month (ISO):`, record.month.toISOString());
        console.log(`Local Browser Interpretation (GMT+8 assumed):`);
        const localDate = new Date(record.month);
        console.log(`  Local String: ${localDate.toString()}`);
        console.log(`  Month Index (0-11): ${localDate.getMonth()}`);

        const expectedMonthIndex = 2;
        if (localDate.getMonth() === expectedMonthIndex) {
            console.log("MATCH: Correct Month");
        } else {
            console.log("MISMATCH: Wrong Month");
        }
    }
}

async function main() {
    await debugReordering();
    await debugDateLogic();
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
