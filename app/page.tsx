import { getDashboardData, getExpensesForMonth } from "./actions";
import { AssetGrowthChart, SpendingPieChart } from "@/components/DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { assets, totalNetWorth } = await getDashboardData();
  const currentMonthExpenses = await getExpensesForMonth(new Date());

  return (
    <main className="p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header Section */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
            <p className="text-muted-foreground">Overview of your financial health.</p>
          </div>

          <div className="flex items-center gap-4 rounded-lg border bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Net Worth</h2>
              <p className="text-3xl font-bold text-primary">${totalNetWorth.toLocaleString()}</p>
            </div>
          </div>
        </header>

        {/* Top Row: Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Asset Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetGrowthChart assets={assets} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <SpendingPieChart expenses={currentMonthExpenses} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
