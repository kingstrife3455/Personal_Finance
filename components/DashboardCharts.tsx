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
