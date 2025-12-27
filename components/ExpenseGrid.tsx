"use client";

import { updateExpenseRecord, createCategory, updateCategory, moveCategory, deleteCategory, createMainCategory, updateMainCategory, deleteMainCategory } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";

type MainCategory = {
    id: string;
    name: string;
};

type Category = {
    id: string;
    name: string;
    color: string;
    mainCategoryId?: string | null;
    records: {
        year: number;
        month: number;
        amount: number;
    }[];
};

function ManageMainLabels({ mainCategories }: { mainCategories: MainCategory[] }) {
    const [newName, setNewName] = useState("");
    const router = useRouter();

    const handleCreate = async () => {
        if (!newName) return;
        await createMainCategory(newName);
        setNewName("");
        router.refresh();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Manage Main Labels</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Main Labels</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="New Main Label"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <Button onClick={handleCreate}>Add</Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {mainCategories.map(mc => (
                            <div key={mc.id} className="flex items-center gap-2 justify-between p-2 border rounded">
                                <Input
                                    defaultValue={mc.name}
                                    onBlur={async (e) => {
                                        if (e.target.value !== mc.name) {
                                            await updateMainCategory(mc.id, e.target.value);
                                            router.refresh(); // Refresh to update selects
                                        }
                                    }}
                                    className="h-8 w-full"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                        if (confirm(`Delete "${mc.name}"?`)) {
                                            try {
                                                await deleteMainCategory(mc.id);
                                                router.refresh();
                                            } catch (e: any) {
                                                alert(e.message);
                                            }
                                        }
                                    }}
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function ExpenseGrid({ categories, mainCategories }: { categories: Category[], mainCategories: MainCategory[] }) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    // Generate Jan-Dec for selectedYear
    const months = Array.from({ length: 12 }, (_, i) => {
        return new Date(selectedYear, i, 1);
    });

    const handleUpdate = async (categoryId: string, month: Date, value: string) => {
        const numValue = parseFloat(value);
        // Allow updating to 0 or clearing
        if (!isNaN(numValue)) {
            await updateExpenseRecord(categoryId, selectedYear, month.getMonth(), numValue);
            router.refresh();
        }
    };

    const handleCreateCategory = async (formData: FormData) => {
        await createCategory(formData);
        setIsCreating(false);
        router.refresh();
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
                <div className="flex gap-2 items-center">
                    <ManageMainLabels mainCategories={mainCategories} />
                    {isCreating ? (
                        <form action={handleCreateCategory} className="flex gap-2 items-center border p-1 rounded bg-card">
                            <Input name="name" placeholder="Name" className="w-[150px] h-8" required />
                            <select
                                name="mainCategoryId"
                                className="h-8 border rounded px-2 text-sm bg-background"
                            >
                                <option value="">No Main Label</option>
                                {mainCategories.map(mc => (
                                    <option key={mc.id} value={mc.id}>{mc.name}</option>
                                ))}
                            </select>
                            <Input type="color" name="color" defaultValue="#ef4444" className="w-8 h-8 p-0" />
                            <Button type="submit" size="sm" className="h-8">Save</Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setIsCreating(false)}>X</Button>
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
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[200px] sticky left-0 bg-background/95 backdrop-blur z-20 border">Category</th>
                            <th className="h-12 px-2 text-left align-middle font-medium text-muted-foreground min-w-[150px] border">Main Label</th>
                            {months.map((m) => (
                                <th key={m.toISOString()} className="h-12 px-4 text-right align-middle font-medium text-muted-foreground min-w-[120px] border">
                                    {format(m, "MMM")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat) => (
                            <tr key={cat.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle font-medium sticky left-0 bg-card z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border group">
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleMove(cat.id, 'up')} className="text-[10px] hover:text-foreground text-muted-foreground">▲</button>
                                            <button onClick={() => handleMove(cat.id, 'down')} className="text-[10px] hover:text-foreground text-muted-foreground">▼</button>
                                        </div>
                                        <Input
                                            type="color"
                                            className="h-5 w-5 rounded-full p-0 border-0 flex-shrink-0 overflow-hidden cursor-pointer"
                                            defaultValue={cat.color}
                                            onBlur={(e) => {
                                                if (e.target.value !== cat.color) {
                                                    updateCategory(cat.id, { color: e.target.value });
                                                    router.refresh();
                                                }
                                            }}
                                        />
                                        <Input
                                            className="h-7 bg-transparent border-transparent hover:border-input focus:border-input px-1 font-medium min-w-[120px]"
                                            defaultValue={cat.name}
                                            onBlur={(e) => {
                                                if (e.target.value !== cat.name) {
                                                    updateCategory(cat.id, { name: e.target.value });
                                                    router.refresh();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Delete category?`)) {
                                                    try { await deleteCategory(cat.id); router.refresh(); } catch (e: any) { alert(e.message); }
                                                }
                                            }}
                                            className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </td>
                                <td className="p-2 border">
                                    <select
                                        className="w-full h-8 bg-transparent border-transparent hover:border-input rounded px-1 text-xs"
                                        value={cat.mainCategoryId || ""}
                                        onChange={async (e) => {
                                            const val = e.target.value || null;
                                            await updateCategory(cat.id, { mainCategoryId: val });
                                            router.refresh();
                                        }}
                                    >
                                        <option value="">(None)</option>
                                        {mainCategories.map(mc => (
                                            <option key={mc.id} value={mc.id}>{mc.name}</option>
                                        ))}
                                    </select>
                                </td>
                                {months.map((m) => {
                                    const record = cat.records.find(
                                        (r) =>
                                            r.month === m.getMonth() &&
                                            r.year === m.getFullYear()
                                    );

                                    return (
                                        <td key={m.toISOString()} className="p-0 border align-middle">
                                            <div className="relative group">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full pl-5 text-right h-10 bg-transparent border-transparent hover:bg-muted/30 focus:bg-background focus:border-input rounded-none transition-all"
                                                    defaultValue={record?.amount}
                                                    onBlur={(e) => handleUpdate(cat.id, m, e.target.value)}
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-muted/50 border-t font-semibold">
                        <tr>
                            <td className="p-4 align-middle sticky left-0 bg-muted/95 backdrop-blur z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border" colSpan={2}>Total</td>
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
                                    <td key={m.toISOString()} className="p-2 px-4 text-right align-middle border">
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
