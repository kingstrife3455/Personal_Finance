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
        month: Date;
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
    // Aggregate data by month
    const timeline = new Map<string, number>();

    // Get all unique record months
    const allMonths = new Set<string>();
    assets.forEach(a => a.records.forEach(r => allMonths.add(new Date(r.month).toISOString())));

    // Sort months
    const sortedMonths = Array.from(allMonths).sort().map(d => new Date(d));

    // Build data points
    const data = sortedMonths.map(month => {
        let total = 0;
        assets.forEach(asset => {
            // Find record for this month
            const record = asset.records.find(r =>
                new Date(r.month).getTime() === month.getTime()
            );
            if (record) {
                total += record.value;
            } else {
                // If no record for this month, carry forward previous known value (naive approach) 
                // or just leave it. Let's strictly sum for now.
                // Better approach: Find most recent record BEFORE or AT this month
                const recentRecord = [...asset.records]
                    .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
                    .find(r => new Date(r.month).getTime() <= month.getTime());

                if (recentRecord) {
                    total += recentRecord.value;
                }
            }
        });
        return {
            name: format(month, 'MMM yy'),
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
