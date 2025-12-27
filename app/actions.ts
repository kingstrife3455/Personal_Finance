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

    if (direction === 'up') {
        const prev = await prisma.asset.findFirst({
            where: { order: { lt: asset.order } },
            orderBy: { order: 'desc' }
        });
        if (prev) {
            await prisma.$transaction([
                prisma.asset.update({ where: { id: asset.id }, data: { order: prev.order } }),
                prisma.asset.update({ where: { id: prev.id }, data: { order: asset.order } })
            ]);
        }
    } else {
        const next = await prisma.asset.findFirst({
            where: { order: { gt: asset.order } },
            orderBy: { order: 'asc' }
        });
        if (next) {
            await prisma.$transaction([
                prisma.asset.update({ where: { id: asset.id }, data: { order: next.order } }),
                prisma.asset.update({ where: { id: next.id }, data: { order: asset.order } })
            ]);
        }
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

export async function updateAssetRecord(assetId: string, month: Date, value: number) {
    const recordMonth = new Date(month.getFullYear(), month.getMonth(), 1);

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

    if (direction === 'up') {
        const prev = await prisma.category.findFirst({
            where: { order: { lt: category.order } },
            orderBy: { order: 'desc' }
        });
        if (prev) {
            await prisma.$transaction([
                prisma.category.update({ where: { id: category.id }, data: { order: prev.order } }),
                prisma.category.update({ where: { id: prev.id }, data: { order: category.order } })
            ]);
        }
    } else {
        const next = await prisma.category.findFirst({
            where: { order: { gt: category.order } },
            orderBy: { order: 'asc' }
        });
        if (next) {
            await prisma.$transaction([
                prisma.category.update({ where: { id: category.id }, data: { order: next.order } }),
                prisma.category.update({ where: { id: next.id }, data: { order: category.order } })
            ]);
        }
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

export async function updateExpenseRecord(categoryId: string, month: Date, amount: number) {
    const recordMonth = new Date(month.getFullYear(), month.getMonth(), 1);

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
