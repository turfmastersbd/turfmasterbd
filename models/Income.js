import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  arena: {
    type: String,
    required: true,
    enum: ["Turf Masters BD"],
  },
  type: {
    type: String,
    required: true,
    enum: ["Slot Booking", "Item Sell", "Cash from Other Admins", "Others"],
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
  note: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
}, { timestamps: true });

export default mongoose.models.Income || mongoose.model("Income", incomeSchema);
