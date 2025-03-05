import express from "express";
import cors from "cors";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { logActivity } from "./adminRoutes.js";
import Stripe from "stripe";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } else {
    console.warn('STRIPE_SECRET_KEY not found in environment variables');
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
}

const router = express.Router();

router.use(cors());

// Function to generate PromptPay QR Code
async function generatePromptPayQR(amount) {
  const mobileNumber = "0899999999"; // เบอร์ PromptPay ของร้าน
  const payload = generatePayload(mobileNumber, { amount });
  return await QRCode.toDataURL(payload);
}

// ✅ 1. สร้างคำสั่งซื้อใหม่
router.post("/", protect, async (req, res) => {
  try {
    const { paymentMethod, shippingAddress } = req.body;
    
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const orderData = {
      user: req.user.id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      totalAmount: cart.items.reduce((total, item) => total + (item.quantity * item.product.price), 0),
      paymentMethod,
      shippingAddress
    };

    const order = new Order(orderData);

    // ถ้าเป็นการชำระด้วยบัตรเครดิต
    if (paymentMethod === 'credit') {
      if (!stripe) {
        return res.status(500).json({ 
          message: "Stripe payment not available",
          error: "Stripe configuration missing" 
        });
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(orderData.totalAmount * 100),
          currency: 'thb',
          metadata: { orderId: order._id.toString() }
        });
        
        order.transactionId = paymentIntent.id;
        await order.save();
        await Cart.findOneAndDelete({ user: req.user.id });
        
        res.status(201).json({
          order,
          clientSecret: paymentIntent.client_secret
        });
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        return res.status(500).json({ 
          message: "Payment processing error",
          error: stripeError.message 
        });
      }
    }
    // ถ้าเป็น PromptPay
    else if (paymentMethod === 'promptpay') {
      try {
        const qrCode = await generatePromptPayQR(orderData.totalAmount);
        order.paymentStatus = 'pending';
        await order.save();
        await Cart.findOneAndDelete({ user: req.user.id });
        
        res.status(201).json({
          order,
          qrCode
        });
      } catch (qrError) {
        console.error('QR Code generation error:', qrError);
        return res.status(500).json({ 
          message: "QR Code generation failed",
          error: qrError.message 
        });
      }
    }
    // ถ้าเป็นเงินสด
    else {
      order.paymentStatus = 'pending';
      await order.save();
      await Cart.findOneAndDelete({ user: req.user.id });
      
      res.status(201).json({ order });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: "Server Error", 
      error: error.message,
      stack: error.stack 
    });
  }
});

// ✅ 2. ดึงคำสั่งซื้อของผู้ใช้ที่ล็อกอิน
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// ✅ 3. ดึงคำสั่งซื้อตาม ID
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ 4. อัปเดตสถานะการชำระเงิน
router.put("/:id/pay", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.paymentStatus = 'paid';
    order.paidAt = Date.now();
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// ✅ 5. อัปเดตสถานะการจัดส่ง (Admin เท่านั้น)
router.put("/:id/deliver", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isDelivered = true;
    order.deliveredAt = new Date();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ 6. ลบคำสั่งซื้อ (Admin เท่านั้น)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.deleteOne();
    res.json({ message: "Order deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// อัพเดทสถานะคำสั่งซื้อ
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }

    const oldStatus = order.status;
    order.status = req.body.status;
    await order.save();

    // บันทึกกิจกรรม
    await logActivity(
      'ORDER_STATUS_CHANGE',
      `อัพเดทสถานะคำสั่งซื้อ #${order._id} จาก ${oldStatus} เป็น ${order.status}`,
      { 
        orderId: order._id,
        oldStatus,
        newStatus: order.status 
      }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

export default router;
