
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

type Asset = {
    id: string;
    name: string;
    records: {
        year: number;
        month: number;
        value: number;
    }[];
};

export function GrowthWidget({ asset }: { asset: Asset }) {
    if (!asset) return null;

    const currentYear = new Date().getFullYear(); // 2025
    const yearsToCheck = [currentYear, currentYear - 1, currentYear - 2];

    const getYearEndValue = (year: number) => {
        // Try to get December
        let record = asset.records.find(r => r.year === year && r.month === 11);

        // Use latest available if no Dec (e.g., current year in progress)
        if (!record) {
            const yearRecords = asset.records.filter(r => r.year === year).sort((a, b) => b.month - a.month);
            if (yearRecords.length > 0) record = yearRecords[0];
        }

        return record ? record.value : 0;
    };

    const cards = yearsToCheck.map(year => {
        const valEnd = getYearEndValue(year);
        const valStart = getYearEndValue(year - 1); // Previous year end is our start base

        // If we don't have a start value (e.g. data didn't exist 2 years ago), growth is effectively the end value if it's new money, 
        // but strictly "growth" implies change. If valStart is 0, let's treat growth as valEnd (initial funding).

        const growth = valEnd - valStart;
        const percent = valStart !== 0 ? (growth / valStart) * 100 : 0;

        return {
            year: year === currentYear ? `${year} YTD` : year,
            growth,
            percent,
            hasData: valEnd !== 0 || valStart !== 0 // Hide if completely empty years
        };
    }).reverse(); // Show oldest first (2023, 2024, 2025)

    return (
        <div className="grid grid-cols-3 gap-4">
            {cards.map((item) => (
                <Card key={item.year}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {asset.name} Growth ({item.year})
                        </CardTitle>
                        {item.growth > 0 ? (
                            <ArrowUpIcon className="h-4 w-4 text-green-500" />
                        ) : item.growth < 0 ? (
                            <ArrowDownIcon className="h-4 w-4 text-red-500" />
                        ) : (
                            <MinusIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${item.growth > 0 ? 'text-green-600' : item.growth < 0 ? 'text-red-600' : ''}`}>
                            {item.growth > 0 ? '+' : ''}{item.growth.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {item.growth > 0 ? '+' : ''}{item.percent.toFixed(1)}% from prev year
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
