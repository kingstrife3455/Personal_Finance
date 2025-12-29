"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createAsset(formData: FormData) {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const color = formData.get("color") as string || "#000000";
    const isRetirement = formData.get("isRetirement") === "true";

    const maxOrderAgg = await prisma.asset.aggregate({
        _max: { order: true }
    });
    const nextOrder = (maxOrderAgg._max.order ?? 0) + 1;

    await prisma.asset.create({
        data: {
            name,
            type,
            color,
            order: nextOrder,
            isRetirement
        },
    });

    revalidatePath("/");
    revalidatePath("/assets");
    revalidatePath("/retirement");
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

    // Update all orders efficiently in a transaction
    const updates = newAssets.map((asset, index) =>
        prisma.asset.update({
            where: { id: asset.id },
            data: { order: index + 1 }
        })
    );

    await prisma.$transaction(updates);

    revalidatePath("/", 'layout');
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

export async function createMainCategory(name: string) {
    await prisma.mainCategory.create({
        data: { name }
    });
    revalidatePath("/expenses");
}

export async function updateMainCategory(id: string, name: string) {
    await prisma.mainCategory.update({
        where: { id },
        data: { name }
    });
    revalidatePath("/expenses");
}

export async function deleteMainCategory(id: string) {
    // Check if attached to any categories
    const count = await prisma.category.count({
        where: { mainCategoryId: id }
    });

    if (count > 0) {
        throw new Error("Cannot delete Main Category that has sub-categories.");
    }

    await prisma.mainCategory.delete({
        where: { id }
    });
    revalidatePath("/expenses");
}

export async function createCategory(formData: FormData) {
    const name = formData.get("name") as string;
    const color = formData.get("color") as string || "#000000";
    const mainCategoryId = formData.get("mainCategoryId") as string || null;

    const maxOrderAgg = await prisma.category.aggregate({
        _max: { order: true }
    });
    const nextOrder = (maxOrderAgg._max.order ?? 0) + 1;

    await prisma.category.create({
        data: {
            name,
            color,
            order: nextOrder,
            mainCategoryId: mainCategoryId === "" ? null : mainCategoryId
        }
    });

    revalidatePath("/");
    revalidatePath("/expenses");
}

export async function updateCategory(id: string, data: { name?: string, color?: string, mainCategoryId?: string | null }) {
    await prisma.category.update({
        where: { id },
        data
    });

    revalidatePath("/");
    revalidatePath("/expenses");
}

export async function moveCategory(id: string, direction: 'up' | 'down') {
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

    const updates = newCategories.map((cat, index) =>
        prisma.category.update({
            where: { id: cat.id },
            data: { order: index + 1 }
        })
    );

    await prisma.$transaction(updates);

    revalidatePath("/", 'layout');
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

export async function getAllMainCategories() {
    return prisma.mainCategory.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function getDashboardData() {
    noStore();
    const assets = await prisma.asset.findMany({
        orderBy: { order: 'asc' },
        include: {
            records: { orderBy: { month: 'asc' } }
        }
    });

    const categories = await prisma.category.findMany({
        orderBy: { order: 'asc' },
        include: {
            mainCategory: true,
            records: { orderBy: { month: 'asc' } }
        }
    });

    // Calculate dates
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();

    // Create Date objects for comparison
    // We use UTC 1st of month as stored in DB
    const currentMonthDate = new Date(Date.UTC(currentYear, currentMonth, 1));

    // Previous Month
    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
    }
    const prevMonthDate = new Date(Date.UTC(prevYear, prevMonth, 1));

    let totalNetWorth = 0;
    let totalNetWorthPrev = 0;

    assets.forEach(asset => {
        // Find current month record
        const currentRecord = asset.records.find(r => r.month.getTime() === currentMonthDate.getTime());
        const prevRecord = asset.records.find(r => r.month.getTime() === prevMonthDate.getTime());
        // Fallback to latest if current/prev missing? 
        // Logic: if current missing, maybe 0? Or latest? "Show previous month and current month"
        // Let's rely on exact matches for dashboard "Current" vs "Previous"

        if (currentRecord) totalNetWorth += currentRecord.value;
        if (prevRecord) totalNetWorthPrev += prevRecord.value;
    });

    return {
        assets: assets.map(a => ({
            ...a,
            records: a.records.map(r => ({
                id: r.id,
                value: r.value,
                year: r.month.getUTCFullYear(),
                month: r.month.getUTCMonth()
            }))
        })),
        categories: categories.map(c => ({
            ...c,
            records: c.records.map(r => ({
                id: r.id,
                amount: r.amount,
                year: r.month.getUTCFullYear(),
                month: r.month.getUTCMonth()
            }))
        })),
        totalNetWorth,
        totalNetWorthPrev
    };
}


export async function getExpenseStats() {
    noStore();
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();

    const currentMonthDate = new Date(Date.UTC(currentYear, currentMonth, 1));

    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
    }
    const prevMonthDate = new Date(Date.UTC(prevYear, prevMonth, 1));

    // Get all categories with records
    const categories = await prisma.category.findMany({
        include: {
            mainCategory: true,
            records: {
                where: {
                    month: {
                        in: [currentMonthDate, prevMonthDate]
                    }
                }
            }
        }
    });

    const yearlyRecords = await prisma.expenseRecord.findMany({
        where: {
            month: {
                gte: new Date(Date.UTC(currentYear, 0, 1)), // Start of this year
                lte: new Date(Date.UTC(currentYear, 11, 1)) // End of this year
            }
        }
    });

    // Group by month for yearly chart
    const yearlyTrend = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        amount: 0
    }));

    yearlyRecords.forEach(r => {
        const m = r.month.getUTCMonth();
        yearlyTrend[m].amount += r.amount;
    });

    // Breakdown by Main Label (or Category Name if no label)
    const breakdownCurrent: Record<string, number> = {};
    const breakdownPrev: Record<string, number> = {};

    categories.forEach(cat => {
        const label = cat.mainCategory?.name || "Uncategorized"; // Or maybe prioritize Main Label, fallback to ...? User said "tag existing categories to a main label".
        // Actually user wants: "monthly breakdown should show the different labels and their percentage"

        const currentRec = cat.records.find(r => r.month.getTime() === currentMonthDate.getTime());
        const prevRec = cat.records.find(r => r.month.getTime() === prevMonthDate.getTime());

        if (currentRec) {
            breakdownCurrent[label] = (breakdownCurrent[label] || 0) + currentRec.amount;
        }
        if (prevRec) {
            breakdownPrev[label] = (breakdownPrev[label] || 0) + prevRec.amount;
        }
    });

    // Average Expense (excluding highest and lowest month of the last 12 months)
    // We need last 12 months data
    const last12MonthsStart = new Date(Date.UTC(currentYear - 1, currentMonth + 1, 1)); // 1 year ago next month ? Roughly.
    // Easier: fetch all records for last 12 months.
    // actually user said "remove highest and lowest expense month, then take an average of the remaining 10 months"
    // Assuming this means across the "year" or "last 12 months". "across the year" usually means THIS year. 
    // "Include a average expense widget but remove the highest and lowest expense month ... average of remaining 10 months"
    // This implies a full year context. Let's assume current year mostly, or last 12 months. 
    // Given the trend chart is "across the year", let's use the current year's data for the average if we have enough data (at least 3 months to drop 2).
    // Or maybe last 12 months is safer if beginning of year. 
    // "Across the year" -> trend line. "Display this average" -> widget. 
    // Let's use the last 12 available months effectively, or just the current year if that's the context.
    // Let's stick to Current Year for consistent context with the trend chart.

    const monthlyTotals = yearlyTrend.map(yx => yx.amount).filter(a => a > 0);
    // Filter 0? If month hasn't happened yet? 
    // We should only count months that have passed or have data? 
    // Use `yearlyRecords` grouped by month.

    const validMonths = new Set(yearlyRecords.map(r => r.month.getTime()));
    const monthsWithData = Array.from(validMonths).map(t => {
        const d = new Date(t);
        const m = d.getUTCMonth();
        return yearlyTrend[m].amount;
    });

    let averageExpense = 0;
    if (monthsWithData.length > 2) {
        const min = Math.min(...monthsWithData);
        const max = Math.max(...monthsWithData);
        const sum = monthsWithData.reduce((a, b) => a + b, 0);
        averageExpense = (sum - min - max) / (monthsWithData.length - 2);
    } else if (monthsWithData.length > 0) {
        averageExpense = monthsWithData.reduce((a, b) => a + b, 0) / monthsWithData.length;
    }

    return {
        breakdownCurrent,
        breakdownPrev,
        yearlyTrend,
        averageExpense
    };
}

export async function getExpensesForMonth(month: Date) {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);

    const categories = await prisma.category.findMany({
        include: {
            mainCategory: true,
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
            color: cat.color,
            mainCategoryName: cat.mainCategory?.name
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

export async function uploadRetirementCSV(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const text = await file.text();
    const rows = text.split(/\r?\n/).map(row => row.split(',').map(cell => cell.trim()));

    if (rows.length < 5) throw new Error("Invalid CSV format: Too few rows");

    // Ensure assets exist
    const assetTypes = ["OA", "MA", "SA"];
    const assetMap: Record<string, string> = {}; // Name -> ID

    for (const name of assetTypes) {
        let asset = await prisma.asset.findFirst({
            where: { name, isRetirement: true }
        });

        if (!asset) {
            // Create if missing
            const maxOrderAgg = await prisma.asset.aggregate({
                _max: { order: true }
            });
            const nextOrder = (maxOrderAgg._max.order ?? 0) + 1;

            asset = await prisma.asset.create({
                data: {
                    name,
                    type: "CPF",
                    isRetirement: true,
                    order: nextOrder,
                    color: name === "OA" ? "#3b82f6" : name === "MA" ? "#10b981" : "#f59e0b"
                }
            });
        }
        assetMap[name] = asset.id;
    }

    // Parse Data
    const years = rows[0];
    const months = rows[1];
    const oaValues = rows[2];
    const maValues = rows[3];
    const saValues = rows[4];

    const parseMonth = (mStr: string) => {
        const d = new Date(`${mStr} 1, 2000`);
        if (!isNaN(d.getMonth())) return d.getMonth();
        return -1;
    };

    const updates = [];

    for (let i = 1; i < years.length; i++) {
        const yearStr = years[i];
        const monthStr = months[i];

        if (!yearStr || !monthStr) continue;

        const year = parseInt(yearStr);
        const monthIndex = parseMonth(monthStr);

        if (isNaN(year) || monthIndex === -1) continue;

        const values = {
            "OA": parseFloat(oaValues[i]),
            "MA": parseFloat(maValues[i]),
            "SA": parseFloat(saValues[i])
        };

        for (const [type, val] of Object.entries(values)) {
            if (!isNaN(val)) {
                const assetId = assetMap[type];
                const recordMonth = new Date(Date.UTC(year, monthIndex, 1));

                updates.push(
                    prisma.assetRecord.upsert({
                        where: {
                            assetId_month: {
                                assetId,
                                month: recordMonth,
                            }
                        },
                        update: { value: val },
                        create: {
                            assetId,
                            month: recordMonth,
                            value: val
                        }
                    })
                );
            }
        }
    }

    await prisma.$transaction(updates);
    revalidatePath("/retirement");
}
