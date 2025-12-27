"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

type Asset = {
    id: string;
    records: {
        year: number;
        month: number;
        value: number;
    }[];
};

type Expense = {
    amount: number;
    category: {
        name: string;
        color: string;
    };
};

export function AssetGrowthChart({ assets }: { assets: Asset[] }) {
    // Generate data points for the last 12 months (or relevant range)
    // Since we want to show growth, let's find the min and max dates.

    // Flatten all records to find range
    const allRecords = assets.flatMap(a => a.records.map(r => ({
        ...r,
        dateVal: new Date(Date.UTC(r.year, r.month, 1)).getTime()
    })));

    if (allRecords.length === 0) return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No asset history yet.
        </div>
    );

    const uniqueMonths = Array.from(new Set(allRecords.map(r => r.dateVal))).sort((a, b) => a - b);

    // Build data points
    const data = uniqueMonths.map(time => {
        const date = new Date(time);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();

        let total = 0;
        assets.forEach(asset => {
            // Find exact match
            const record = asset.records.find(r => r.year === year && r.month === month);
            if (record) {
                total += record.value;
            } else {
                // Carry forward? For now, strict sum of what's recorded for that month?
                // Usually asset value is a snapshot. If no snapshot for March, but snapshot for Feb exists,
                // we probably arguably still have that money.
                // Let's implement carry-forward logic for better chart.
                const previousRecords = asset.records
                    .filter(r => {
                        const rTime = new Date(Date.UTC(r.year, r.month, 1)).getTime();
                        return rTime < time;
                    })
                    .sort((a, b) => {
                        const timeA = new Date(Date.UTC(a.year, a.month, 1)).getTime();
                        const timeB = new Date(Date.UTC(b.year, b.month, 1)).getTime();
                        return timeB - timeA;
                    });

                if (previousRecords.length > 0) {
                    total += previousRecords[0].value;
                }
            }
        });

        return {
            name: format(date, 'MMM yyyy'),
            value: total
        };
    });

    if (data.length === 0) return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No asset history yet.
        </div>
    );

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Net Worth"]}
                />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function YearlyExpenseChart({ data }: { data: { month: number, amount: number }[] }) {
    const chartData = data.map(d => ({
        name: format(new Date(2024, d.month, 1), 'MMM'), // Year doesn't matter for month name
        amount: d.amount
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Expenses"]}
                />
                <Line type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function SpendingBreakdown({ current, prev }: { current: Record<string, number>, prev: Record<string, number> }) {
    // Combine keys
    const allLabels = Array.from(new Set([...Object.keys(current), ...Object.keys(prev)]));

    // Sort by current month amount desc
    allLabels.sort((a, b) => (current[b] || 0) - (current[a] || 0));

    const totalCurrent = Object.values(current).reduce((a, b) => a + b, 0);
    const totalPrev = Object.values(prev).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 text-xs font-semibold text-muted-foreground uppercase pb-2 border-b">
                <div>Category</div>
                <div className="text-right">Prev Month</div>
                <div className="text-right">Curr Month</div>
            </div>
            {allLabels.map(label => {
                const currAmount = current[label] || 0;
                const prevAmount = prev[label] || 0;

                const currPercent = totalCurrent > 0 ? (currAmount / totalCurrent) * 100 : 0;
                const prevPercent = totalPrev > 0 ? (prevAmount / totalPrev) * 100 : 0;

                return (
                    <div key={label} className="grid grid-cols-3 items-center text-sm">
                        <div className="font-medium truncate">{label}</div>
                        <div className="text-right">
                            <div>${prevAmount.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{prevPercent.toFixed(1)}%</div>
                        </div>
                        <div className="text-right font-medium">
                            <div>${currAmount.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{currPercent.toFixed(1)}%</div>
                        </div>
                    </div>
                );
            })}
            {allLabels.length === 0 && (
                <div className="text-center text-muted-foreground py-4">No expenses recorded.</div>
            )}
        </div>
    );
}

export function SpendingPieChart({ expenses }: { expenses: Expense[] }) {
    // Group by category
    const categoryTotals = new Map<string, { value: number, color: string }>();

    expenses.forEach(e => {
        const current = categoryTotals.get(e.category.name) || { value: 0, color: e.category.color };
        categoryTotals.set(e.category.name, {
            value: current.value + e.amount,
            color: current.color
        });
    });

    const data = Array.from(categoryTotals.entries()).map(([name, { value, color }]) => ({
        name,
        value,
        color
    })).sort((a, b) => b.value - a.value);

    if (data.length === 0) return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No expenses recorded.
        </div>
    );

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                />
                <Legend iconType="circle" fontSize={12} />
            </PieChart>
        </ResponsiveContainer>
    );
}
