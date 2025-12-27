import { getDashboardData } from "@/app/actions";
import { AddAssetForm } from "@/components/AddAssetForm";
import { AssetGrid } from "@/components/AssetGrid";
import { AssetGrowthChart } from "@/components/DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function AssetsPage() {
    const { assets } = await getDashboardData();

    return (
        <main className="p-8 font-sans">
            <div className="mx-auto max-w-7xl space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
                    <p className="text-muted-foreground">Track and update your asset balances.</p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Asset Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AssetGrowthChart assets={assets} />
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Asset Spreadsheet</h2>
                        <AddAssetForm />
                    </div>
                    <AssetGrid assets={assets} />
                </div>
            </div>
        </main>
    );
}
