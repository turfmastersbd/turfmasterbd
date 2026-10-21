import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["SUPER_ADMIN", "GENERAL_ADMIN", "VIEWER", "MANAGER", "REGULAR_CUSTOMER", "SPECIAL_CUSTOMER"],
    default: "REGULAR_CUSTOMER"
  },
  currentBalance: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// In development, clear the model from cache to ensure schema updates are applied
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model("User", userSchema);