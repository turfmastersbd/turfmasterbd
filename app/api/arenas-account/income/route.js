import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Income from "@/models/Income";

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

        const incomes = await Income.find(query).sort({ date: -1 });
        return NextResponse.json(incomes);
    } catch (error) {
        console.error("GET INCOME ERROR:", error);
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

        const newIncome = await Income.create({
            ...body,
            createdBy: session.user.id
        });

        return NextResponse.json(newIncome, { status: 201 });
    } catch (error) {
        console.error("POST INCOME ERROR:", error);
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

        const updatedIncome = await Income.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(updatedIncome);
    } catch (error) {
        console.error("PUT INCOME ERROR:", error);
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

        await Income.findByIdAndDelete(id);
        return NextResponse.json({ message: "Income deleted" });
    } catch (error) {
        console.error("DELETE INCOME ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
