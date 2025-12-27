"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createAsset(formData: FormData) {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const color = formData.get("color") as string || "#000000";

    const maxOrderAgg = await prisma.asset.aggregate({
        _max: { order: true }
    });
    const nextOrder = (maxOrderAgg._max.order ?? 0) + 1;

    await prisma.asset.create({
        data: {
            name,
            type,
            color,
            order: nextOrder
        },
    });

    revalidatePath("/");
    revalidatePath("/assets");
}

export async function updateAsset(id: string, data: { name?: string, color?: string, type?: string }) {
    await prisma.asset.update({
        where: { id },
        data
    });

    revalidatePath("/");
    revalidatePath("/assets");
}

export async function moveAsset(id: string, direction: 'up' | 'down') {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return;

    const assets = await prisma.asset.findMany({
        orderBy: { order: 'asc' }
    });

    const currentIndex = assets.findIndex(a => a.id === id);
    if (currentIndex === -1) return;

    const newAssets = [...assets];
    if (direction === 'up' && currentIndex > 0) {
        [newAssets[currentIndex], newAssets[currentIndex - 1]] = [newAssets[currentIndex - 1], newAssets[currentIndex]];
    } else if (direction === 'down' && currentIndex < newAssets.length - 1) {
        [newAssets[currentIndex], newAssets[currentIndex + 1]] = [newAssets[currentIndex + 1], newAssets[currentIndex]];
    } else {
        return; // specific direction move not possible
    }

    // Update all orders to be consistent 1..N
    // We update all because it's safer and fixes any existing gaps/duplicates
    for (let i = 0; i < newAssets.length; i++) {
        await prisma.asset.update({
            where: { id: newAssets[i].id },
            data: { order: i + 1 }
        });
    }

    revalidatePath("/");
    revalidatePath("/assets");
}

export async function deleteAsset(id: string) {
    // Only allow deletion if there are NO records with > 0 amount.
    const recordCount = await prisma.assetRecord.count({
        where: {
            assetId: id,
            value: { not: 0 }
        }
    });

    if (recordCount > 0) {
        throw new Error("Cannot delete asset with existing records.");
    }

    await prisma.asset.delete({
        where: { id }
    });

    revalidatePath("/");
    revalidatePath("/assets");
}

export async function updateAssetRecord(assetId: string, year: number, monthIndex: number, value: number) {
    // Create UTC date for the 1st of the month to be safe, or just local date at noon to avoid boundary issues.
    // However, Prisma stores DateTime as absolute UTC timestamps usually.
    // If we want "January 2025", we want 2025-01-01 00:00:00 UTC implied.
    // The previous bug was `new Date(month)` in client was local time, e.g. Jan 1 00:00 GMT+8 -> Dec 31 16:00 UTC prev year.
    // We construct it here.
    const recordMonth = new Date(Date.UTC(year, monthIndex, 1));

    await prisma.assetRecord.upsert({
        where: {
            assetId_month: {
                assetId,
                month: recordMonth,
            }
        },
        update: {
            value,
        },
        create: {
            assetId,
            month: recordMonth,
            value,
        }
    });

    revalidatePath("/");
    revalidatePath("/assets");
}

export async function createCategory(formData: FormData) {
    const name = formData.get("name") as string;
    const color = formData.get("color") as string || "#000000";

    const maxOrderAgg = await prisma.category.aggregate({
        _max: { order: true }
    });
    const nextOrder = (maxOrderAgg._max.order ?? 0) + 1;

    await prisma.category.create({
        data: {
            name,
            color,
            order: nextOrder
        }
    });

    revalidatePath("/");
    revalidatePath("/expenses");
}

export async function updateCategory(id: string, data: { name?: string, color?: string }) {
    await prisma.category.update({
        where: { id },
        data
    });

    revalidatePath("/");
    revalidatePath("/expenses");
}

export async function moveCategory(id: string, direction: 'up' | 'down') {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return;

    const categories = await prisma.category.findMany({
        orderBy: { order: 'asc' }
    });

    const currentIndex = categories.findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    const newCategories = [...categories];
    if (direction === 'up' && currentIndex > 0) {
        [newCategories[currentIndex], newCategories[currentIndex - 1]] = [newCategories[currentIndex - 1], newCategories[currentIndex]];
    } else if (direction === 'down' && currentIndex < newCategories.length - 1) {
        [newCategories[currentIndex], newCategories[currentIndex + 1]] = [newCategories[currentIndex + 1], newCategories[currentIndex]];
    } else {
        return;
    }

    for (let i = 0; i < newCategories.length; i++) {
        await prisma.category.update({
            where: { id: newCategories[i].id },
            data: { order: i + 1 }
        });
    }

    revalidatePath("/");
    revalidatePath("/expenses");
}

export async function deleteCategory(id: string) {
    // Only allow deletion if there are NO records with > 0 amount or just NO records.
    // User requirement: "ensure that the deletion will only be performed if there are no expenses tagged with the category"
    // We check for any records where amount != 0.
    const recordCount = await prisma.expenseRecord.count({
        where: {
            categoryId: id,
            amount: { not: 0 }
        }
    });

    if (recordCount > 0) {
        throw new Error("Cannot delete category with existing expenses.");
    }

    await prisma.category.delete({
        where: { id }
    });

    revalidatePath("/");
    revalidatePath("/expenses");
}

export async function updateExpenseRecord(categoryId: string, year: number, monthIndex: number, amount: number) {
    const recordMonth = new Date(Date.UTC(year, monthIndex, 1));

    await prisma.expenseRecord.upsert({
        where: {
            categoryId_month: {
                categoryId,
                month: recordMonth,
            }
        },
        update: {
            amount,
        },
        create: {
            categoryId,
            month: recordMonth,
            amount,
        }
    });

    revalidatePath("/");
    revalidatePath("/expenses");
}

export async function getDashboardData() {
    const assets = await prisma.asset.findMany({
        orderBy: {
            order: 'asc'
        },
        include: {
            records: {
                orderBy: {
                    month: 'asc'
                }
            }
        }
    });

    const categories = await prisma.category.findMany({
        orderBy: {
            order: 'asc'
        },
        include: {
            records: {
                orderBy: {
                    month: 'asc'
                }
            }
        }
    });

    let totalNetWorth = 0;
    assets.forEach(asset => {
        if (asset.records.length > 0) {
            totalNetWorth += asset.records[asset.records.length - 1].value;
        }
    });

    return {
        assets,
        categories,
        totalNetWorth
    };
}

export async function getExpensesForMonth(month: Date) {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);

    const categories = await prisma.category.findMany({
        include: {
            records: {
                where: {
                    month: start
                }
            }
        }
    });

    return categories.map(cat => ({
        amount: cat.records[0]?.amount || 0,
        category: {
            name: cat.name,
            color: cat.color
        },
        date: start,
        id: cat.records[0]?.id || 'virtual'
    })).filter(e => e.amount > 0);
}

export async function updatePassword(password: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        throw new Error("Not authenticated");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword }
    });
}
