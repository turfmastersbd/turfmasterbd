import mongoose from "mongoose";
import dns from "node:dns";

// Fix SRV DNS lookup & IPv6 resolution issues on local ISP/routers
const applyDnsFix = () => {
  try {
    dns.setDefaultResultOrder("ipv4first");
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  } catch (e) {
    // Ignore error if environment does not allow setting custom DNS servers
  }
};

applyDnsFix();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) throw new Error("MONGODB_URI missing in .env.local / Vercel");

let cached = global.mongoose;

if (!cached) cached = global.mongoose = { conn: null, promise: null };

export async function connectDB() {
  applyDnsFix();
  
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // reset on fail
    throw err; // re-throw error to catch in NextAuth
  }

  return cached.conn;
}

