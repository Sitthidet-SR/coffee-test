import express from "express";
import cors from "cors";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();

router.use(cors());

// ✅ เพิ่มสินค้าลงตะกร้า
router.post("/", protect, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [], totalPrice: 0 });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, price: product.price });
    }

    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// ✅ ดึงข้อมูลตะกร้าสินค้า
router.get("/", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
    console.log('Cart found:', cart); // Debug log
    
    if (!cart) {
      console.log('No cart found for user:', req.user.id); // Debug log
      return res.status(200).json({ items: [] }); // ส่ง empty array แทน 404
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error); // Debug log
    res.status(500).json({ message: "Server Error", error });
  }
});

// ✅ อัปเดตจำนวนสินค้าในตะกร้า
router.put("/:id", protect, async (req, res) => {
  const { quantity } = req.body;
  const userId = req.user.id;
  const productId = req.params.id;

  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ message: "Product not in cart" });

    cart.items[itemIndex].quantity = quantity;
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// ✅ ลบสินค้าจากตะกร้า
router.delete("/:id", protect, async (req, res) => {
  const userId = req.user.id;
  const productId = req.params.id;

  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// ✅ ล้างตะกร้าสินค้า
router.delete("/clear", protect, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

export default router;
