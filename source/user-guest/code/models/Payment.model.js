const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  code: { type: String, required: true },
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: "localusers", required: true },
  idCourse: { type: mongoose.Schema.Types.ObjectId, ref: "courses", required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Payment = mongoose.model("payments", paymentSchema);

module.exports = Payment;
