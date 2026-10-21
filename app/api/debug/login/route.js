import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return new Response(
        JSON.stringify({ error: "Phone and password required" }),
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ phone });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found in DB", user: null }),
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    return new Response(
      JSON.stringify({
        user: {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          passwordFromDB: user.password, // show hashed password
        },
        passwordMatch: isMatch,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
