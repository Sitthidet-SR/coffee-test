import express from "express";
import cors from "cors"; 
import Payment from "../models/Payment.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(cors());

// ✅ 1. สร้างรายการชำระเงิน
router.post("/", protect, async (req, res) => {
  try {
    const { orderId, paymentMethod, transactionId, amount, status } = req.body;

    if (!orderId || !paymentMethod || !transactionId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payment = new Payment({
      user: req.user._id,
      orderId,
      paymentMethod,
      transactionId,
      amount,
      status: status || "pending",
    });

    const createdPayment = await payment.save();
    res.status(201).json(createdPayment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ 2. ดึงข้อมูลการชำระเงินตาม ID
router.get("/:id", protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("user", "name email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ 3. อัปเดตสถานะการชำระเงิน
router.put("/:id", protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = req.body.status || payment.status;
    const updatedPayment = await payment.save();

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
