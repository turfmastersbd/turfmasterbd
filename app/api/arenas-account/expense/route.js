import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function GET(req) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const arena = searchParams.get("arena");
        const date = searchParams.get("date");
        const monthParam = searchParams.get("month");

        await connectDB();

        let query = {};
        if (arena) query.arena = arena;
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        } else if (monthParam) {
            const [y, m] = monthParam.split("-");
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 0, 23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        const expenses = await Expense.find(query).sort({ date: -1 });
        return NextResponse.json(expenses);
    } catch (error) {
        console.error("GET EXPENSE ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        await connectDB();

        const newExpense = await Expense.create({
            ...body,
            createdBy: session.user.id
        });

        return NextResponse.json(newExpense, { status: 201 });
    } catch (error) {
        console.error("POST EXPENSE ERROR:", error);
        return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { id, ...updateData } = body;
        await connectDB();

        const updatedExpense = await Expense.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(updatedExpense);
    } catch (error) {
        console.error("PUT EXPENSE ERROR:", error);
        return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        await connectDB();

        await Expense.findByIdAndDelete(id);
        return NextResponse.json({ message: "Expense deleted" });
    } catch (error) {
        console.error("DELETE EXPENSE ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
