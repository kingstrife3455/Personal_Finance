import { getDashboardData } from "@/app/actions";
import { AddAssetForm } from "@/components/AddAssetForm";
import { CSVUploadModal } from "@/components/CSVUploadModal";
import { AssetGrid } from "@/components/AssetGrid";
import { AssetGrowthChart } from "@/components/DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function RetirementPage() {
    const { assets } = await getDashboardData();
    const retirementAssets = assets.filter((a: any) => a.isRetirement);

    return (
        <main className="p-8 font-sans">
            <div className="mx-auto max-w-7xl space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight text-purple-600">Retirement Assets</h1>
                    <p className="text-muted-foreground">Track your long-term retirement funds (CPF, SRS, etc.).</p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Retirement Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AssetGrowthChart assets={retirementAssets} />
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Retirement Spreadsheet</h2>
                        <div className="flex items-center gap-2">
                            <CSVUploadModal />
                            <AddAssetForm isRetirement={true} />
                        </div>
                    </div>
                    <AssetGrid assets={retirementAssets} />
                </div>
            </div>
        </main>
    );
}
