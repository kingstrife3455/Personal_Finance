import { getDashboardData, getExpenseStats } from "./actions";
import { AssetGrowthChart, YearlyExpenseChart } from "@/components/DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { assets, totalNetWorth, totalNetWorthPrev } = await getDashboardData();
  const { yearlyTrend, breakdownCurrent, breakdownPrev, averageExpense } = await getExpenseStats();

  return (
    <main className="p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header Section */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
            <p className="text-muted-foreground">Overview of your financial health.</p>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-end rounded-lg border bg-card p-4 shadow-sm min-w-[200px]">
              <h2 className="text-sm font-medium text-muted-foreground">Net Worth</h2>
              <p className="text-2xl font-bold text-primary">${totalNetWorth.toLocaleString()}</p>
              <div className="text-xs text-muted-foreground">
                Prev: ${totalNetWorthPrev.toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col items-end rounded-lg border bg-card p-4 shadow-sm min-w-[200px]">
              <h2 className="text-sm font-medium text-muted-foreground">Avg Expense (Adj)</h2>
              <p className="text-2xl font-bold text-red-500">${Math.round(averageExpense).toLocaleString()}</p>
              <div className="text-xs text-muted-foreground">
                Excl. Min/Max
              </div>
            </div>
          </div>
        </header>

        {/* Top Row: Asset Growth & Yearly Expenses */}
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
              <CardTitle>Yearly Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <YearlyExpenseChart data={yearlyTrend} />
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Row */}
        {/* Moved to Expenses Page */}
      </div>
    </main>
  );
}
