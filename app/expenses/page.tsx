import { getDashboardData, getExpensesForMonth } from "@/app/actions";
import { ExpenseGrid } from "@/components/ExpenseGrid";
import { SpendingPieChart } from "@/components/DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
    const { categories } = await getDashboardData();
    const currentMonthExpenses = await getExpensesForMonth(new Date());

    return (
        <main className="p-8 font-sans">
            <div className="mx-auto max-w-7xl space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">Expense Tracking</h1>
                    <p className="text-muted-foreground">Log and analyze your monthly spending.</p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SpendingPieChart expenses={currentMonthExpenses} />
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Expense Spreadsheet</h2>
                    <ExpenseGrid categories={categories} />
                </div>
            </div>
        </main>
    );
}
