import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  arena: {
    type: String,
    required: true,
    enum: ["Royel Turf & Swimming Zone"],
  },
  type: {
    type: String,
    required: true,
    enum: ["Salary", "Utility Bill", "Others"],
  },
  salaryName: {
    type: String,
    required: function () { return this.type === "Salary"; }
  },
  utilityType: {
    type: String,
    required: function () { return this.type === "Utility Bill"; },
    enum: ["Electricity Bill", "Gas Bill", "Service Charge", "Water Bill"],
  },
  customType: {
    type: String,
    required: function () { return this.type === "Others"; }
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
