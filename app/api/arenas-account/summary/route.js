import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Income from "@/models/Income";
import Expense from "@/models/Expense";

export async function GET(req) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date");
        const monthParam = searchParams.get("month");

        let startOfMonth, endOfMonth;

        if (monthParam) {
            const [y, m] = monthParam.split("-");
            startOfMonth = new Date(y, m - 1, 1);
            endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
        } else {
            const selectedDate = new Date(date || new Date().toISOString().split("T")[0]);
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            startOfMonth = new Date(year, month, 1);
            endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        }

        await connectDB();

        const incomeSummary = await Income.aggregate([
            {
                $match: {
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: "$arena",
                    totalIncome: { $sum: "$amount" }
                }
            }
        ]);

        const expenseSummary = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: "$arena",
                    totalExpense: { $sum: "$amount" }
                }
            }
        ]);

        // Format data for easier use in frontend
        const arenas = ["Royel Turf & Swimming Zone"];
        const summary = arenas.map(arena => {
            const income = incomeSummary.find(i => i._id === arena)?.totalIncome || 0;
            const expense = expenseSummary.find(e => e._id === arena)?.totalExpense || 0;
            return {
                arena,
                income,
                expense,
                balance: income - expense
            };
        });

        const totalIncome = summary.reduce((acc, curr) => acc + curr.income, 0);
        const totalExpense = summary.reduce((acc, curr) => acc + curr.expense, 0);

        return NextResponse.json({
            summary,
            totalIncome,
            totalExpense,
            finalBalance: totalIncome - totalExpense
        });
    } catch (error) {
        console.error("GET SUMMARY ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
