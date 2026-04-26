import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  transaction_uuid: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      amount: Number,
      quantity: Number
    }
  ],
  status: {
    type: String,
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    default: 'Unpaid'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
