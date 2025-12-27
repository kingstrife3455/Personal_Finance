"use client";

import { updateExpenseRecord, createCategory, updateCategory, moveCategory, deleteCategory } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
    id: string;
    name: string;
    color: string;
    records: {
        year: number;
        month: number;
        amount: number;
    }[];
};

export function ExpenseGrid({ categories }: { categories: Category[] }) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    // Generate Jan-Dec for selectedYear
    const months = Array.from({ length: 12 }, (_, i) => {
        return new Date(selectedYear, i, 1);
    });

    const handleUpdate = async (categoryId: string, month: Date, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            // We pass the year and month index explicitly to avoid timezone issues
            await updateExpenseRecord(categoryId, selectedYear, month.getMonth(), numValue);
            router.refresh();
        }
    };

    const handleCreateCategory = async (formData: FormData) => {
        await createCategory(formData);
        setIsCreating(false);
        router.refresh(); // Ensure list updates
    };

    const handleMove = async (id: string, direction: 'up' | 'down') => {
        await moveCategory(id, direction);
        router.refresh();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSelectedYear(y => y - 1)}
                        className="p-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                    >
                        ← {selectedYear - 1}
                    </button>
                    <span className="text-lg font-bold">{selectedYear}</span>
                    <button
                        onClick={() => setSelectedYear(y => y + 1)}
                        className="p-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                    >
                        {selectedYear + 1} →
                    </button>
                </div>
                <div className="flex gap-2">
                    {isCreating ? (
                        <form action={handleCreateCategory} className="flex gap-2">
                            <Input name="name" placeholder="Category Name" className="w-[200px]" required />
                            <Input type="color" name="color" defaultValue="#ef4444" className="w-12 p-1" />
                            <Button type="submit" size="sm">Save</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>X</Button>
                        </form>
                    ) : (
                        <Button onClick={() => setIsCreating(true)} variant="outline">+ Add Category</Button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[300px] sticky left-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">Category</th>
                            {months.map((m) => (
                                <th key={m.toISOString()} className="h-12 px-4 text-right align-middle font-medium text-muted-foreground min-w-[140px]">
                                    {format(m, "MMM")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat) => (
                            <tr key={cat.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle font-medium sticky left-0 bg-card z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                onClick={() => handleMove(cat.id, 'up')}
                                                className="h-3 w-3 flex items-center justify-center rounded hover:bg-muted text-[10px] text-muted-foreground leading-none"
                                                title="Move Up"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => handleMove(cat.id, 'down')}
                                                className="h-3 w-3 flex items-center justify-center rounded hover:bg-muted text-[10px] text-muted-foreground leading-none"
                                                title="Move Down"
                                            >
                                                ▼
                                            </button>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Are you sure you want to delete "${cat.name}"?`)) {
                                                    try {
                                                        await deleteCategory(cat.id);
                                                        router.refresh();
                                                    } catch (error: any) {
                                                        alert(error.message);
                                                    }
                                                }
                                            }}
                                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors mx-1"
                                            title="Delete Category"
                                        >
                                            ×
                                        </button>
                                        <Input
                                            type="color"
                                            className="h-6 w-6 rounded-full p-0 border-0 flex-shrink-0 overflow-hidden cursor-pointer"
                                            defaultValue={cat.color}
                                            onBlur={(e) => {
                                                if (e.target.value !== cat.color) {
                                                    updateCategory(cat.id, { color: e.target.value });
                                                    router.refresh();
                                                }
                                            }}
                                        />
                                        <Input
                                            className="h-8 bg-transparent border-transparent hover:border-input focus:border-input px-2 font-medium"
                                            defaultValue={cat.name}
                                            onBlur={(e) => {
                                                if (e.target.value !== cat.name) {
                                                    updateCategory(cat.id, { name: e.target.value });
                                                    router.refresh();
                                                }
                                            }}
                                        />
                                    </div>
                                </td>
                                {months.map((m) => {
                                    const record = cat.records.find(
                                        (r) =>
                                            r.month === m.getMonth() &&
                                            r.year === m.getFullYear()
                                    );

                                    return (
                                        <td key={m.toISOString()} className="p-2 align-middle">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="w-full text-right h-8 bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background transition-all"
                                                defaultValue={record?.amount}
                                                onBlur={(e) => handleUpdate(cat.id, m, e.target.value)}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-muted/50 border-t font-semibold">
                        <tr>
                            <td className="p-4 align-middle sticky left-0 bg-muted/95 backdrop-blur z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Total</td>
                            {months.map((m) => {
                                const total = categories.reduce((sum, cat) => {
                                    const record = cat.records.find(
                                        (r) =>
                                            r.month === m.getMonth() &&
                                            r.year === m.getFullYear()
                                    );
                                    return sum + (record?.amount || 0);
                                }, 0);

                                return (
                                    <td key={m.toISOString()} className="p-2 px-4 text-right align-middle">
                                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                );
                            })}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
