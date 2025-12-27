"use client";

import { updateAssetRecord, updateAsset, moveAsset, deleteAsset } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Asset = {
    id: string;
    name: string;
    type: string;
    color: string;
    records: {
        year: number;
        month: number;
        value: number;
        id: string;
    }[];
};

export function AssetGrid({ assets }: { assets: Asset[] }) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const router = useRouter();

    // Generate Jan-Dec for selectedYear
    const months = Array.from({ length: 12 }, (_, i) => {
        return new Date(selectedYear, i, 1);
    });

    const handleUpdate = async (assetId: string, month: Date, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            // We pass the year and month index explicitly to avoid timezone issues
            // The 'month' Date object in the loop is already constructed from selectedYear and month index (0-11)
            // but passing it as a Date object across the wire can cause shift if client/server tz differ.
            await updateAssetRecord(assetId, selectedYear, month.getMonth(), numValue);
            router.refresh();
        }
    };

    const handleMove = async (id: string, direction: 'up' | 'down') => {
        await moveAsset(id, direction);
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
            </div>

            <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[300px] sticky left-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border">Asset</th>
                            {months.map((m) => (
                                <th key={m.toISOString()} className="h-12 px-4 text-right align-middle font-medium text-muted-foreground min-w-[140px] border">
                                    {format(m, "MMM")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map((asset) => (
                            <tr key={asset.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle font-medium sticky left-0 bg-card z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border">
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                onClick={() => handleMove(asset.id, 'up')}
                                                className="h-3 w-3 flex items-center justify-center rounded hover:bg-muted text-[10px] text-muted-foreground leading-none"
                                                title="Move Up"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => handleMove(asset.id, 'down')}
                                                className="h-3 w-3 flex items-center justify-center rounded hover:bg-muted text-[10px] text-muted-foreground leading-none"
                                                title="Move Down"
                                            >
                                                ▼
                                            </button>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Are you sure you want to delete "${asset.name}"?`)) {
                                                    try {
                                                        await deleteAsset(asset.id);
                                                        router.refresh();
                                                    } catch (error: any) {
                                                        alert(error.message);
                                                    }
                                                }
                                            }}
                                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors mx-1"
                                            title="Delete Asset"
                                        >
                                            ×
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                className="h-6 w-6 rounded-full p-0 border-0 flex-shrink-0 overflow-hidden cursor-pointer"
                                                defaultValue={asset.color || "#000000"}
                                                onBlur={(e) => {
                                                    if (e.target.value !== asset.color) {
                                                        updateAsset(asset.id, { color: e.target.value });
                                                        router.refresh();
                                                    }
                                                }}
                                            />
                                            <div className="flex flex-col">
                                                <Input
                                                    className="h-7 bg-transparent border-transparent hover:border-input focus:border-input px-2 font-medium w-[150px]"
                                                    defaultValue={asset.name}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== asset.name) {
                                                            updateAsset(asset.id, { name: e.target.value });
                                                            router.refresh();
                                                        }
                                                    }}
                                                />
                                                <div className="px-2">
                                                    <select
                                                        className="h-6 w-[150px] bg-transparent text-[10px] text-muted-foreground border-none hover:bg-muted/50 rounded cursor-pointer focus:ring-0 p-0"
                                                        defaultValue={asset.type}
                                                        onChange={(e) => {
                                                            if (e.target.value !== asset.type) {
                                                                updateAsset(asset.id, { type: e.target.value });
                                                                router.refresh();
                                                            }
                                                        }}
                                                    >
                                                        <option value="BANK">BANK</option>
                                                        <option value="INVESTMENT">INVESTMENT</option>
                                                        <option value="REAL_ESTATE">REAL_ESTATE</option>
                                                        <option value="CPF">CPF</option>
                                                        <option value="OTHER">OTHER</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                {months.map((m) => {
                                    // Find record for this month using explicit year/month match
                                    const record = asset.records.find(
                                        (r) =>
                                            r.month === m.getMonth() &&
                                            r.year === m.getFullYear()
                                    );

                                    return (
                                        <td key={m.toISOString()} className="p-2 align-middle border">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full pl-6 text-right h-8 bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background transition-all"
                                                    defaultValue={record?.value}
                                                    onBlur={(e) => handleUpdate(asset.id, m, e.target.value)}
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {assets.length === 0 && (
                            <tr>
                                <td colSpan={months.length + 1} className="p-4 text-center text-muted-foreground border">
                                    No assets found. Add one above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-muted/50 border-t font-semibold">
                        <tr>
                            <td className="p-4 align-middle sticky left-0 bg-muted/95 backdrop-blur z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] border">Total</td>
                            {months.map((m) => {
                                const total = assets.reduce((sum, asset) => {
                                    const record = asset.records.find(
                                        (r) =>
                                            r.month === m.getMonth() &&
                                            r.year === m.getFullYear()
                                    );
                                    return sum + (record?.value || 0);
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
