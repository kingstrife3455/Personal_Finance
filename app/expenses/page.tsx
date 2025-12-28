import { getDashboardData, getExpensesForMonth, getAllMainCategories, getExpenseStats } from "@/app/actions";
import { ExpenseGrid } from "@/components/ExpenseGrid";
import { SpendingBreakdown, YearlyExpenseChart } from "@/components/DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
    const { categories } = await getDashboardData();
    const mainCategories = await getAllMainCategories();
    // Fetch stats for charts
    const { yearlyTrend, breakdownCurrent, breakdownPrev, averageExpense } = await getExpenseStats();

    return (
        <main className="p-8 font-sans">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Expense Tracking</h1>
                        <p className="text-muted-foreground">Log and analyze your monthly spending.</p>
                    </div>
                    <div className="flex flex-col items-end rounded-lg border bg-card p-4 shadow-sm min-w-[200px]">
                        <h2 className="text-sm font-medium text-muted-foreground">Avg Monthly Expense</h2>
                        <p className="text-2xl font-bold text-red-500">${Math.round(averageExpense).toLocaleString()}</p>
                        <div className="text-xs text-muted-foreground">
                            (Excl. Min/Max)
                        </div>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yearly Expenses Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <YearlyExpenseChart data={yearlyTrend} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Expense Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SpendingBreakdown current={breakdownCurrent} prev={breakdownPrev} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Expense Spreadsheet</h2>
                    <ExpenseGrid categories={categories} mainCategories={mainCategories} />
                </div>
            </div>
        </main>
    );
}
