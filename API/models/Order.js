import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['credit', 'promptpay', 'cash']
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    },
    shippingAddress: {
      address: String,
      city: String,
      postalCode: String,
      country: String
    },
    transactionId: String,
    paidAt: Date,
    deliveredAt: Date
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
