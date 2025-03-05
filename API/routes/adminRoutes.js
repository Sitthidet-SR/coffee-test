import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';
import path from 'path';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// คอนฟิก multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // ตรวจสอบว่าโฟลเดอร์ uploads มีอยู่หรือไม่
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น'));
    }
  }
});

// ตั้งค่า Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ย้าย route อัพโหลดรูปมาไว้ก่อน routes อื่นๆ
router.post('/users/:id/upload-profile', protect, isAdmin, upload.single('profileImage'), async (req, res) => {
  try {
    console.log('Upload request received:', req.params.id);
    console.log('File:', req.file);
    console.log('Headers:', req.headers);  // เพิ่ม log headers
    console.log('Body:', req.body);        // เพิ่ม log body

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'user_profiles',
      width: 500,
      height: 500,
      crop: 'fill'
    });

    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    user.profileImage = result.secure_url;
    await user.save();

    console.log('Upload successful:', result.secure_url);

    // บันทึกกิจกรรม
    await logActivity(
      'USER_UPDATE',
      `อัพเดทรูปโปรไฟล์ผู้ใช้ ${user.name}`,
      { userId: user._id }
    );

    res.json({ 
      message: 'อัพโหลดรูปโปรไฟล์สำเร็จ',
      profileImage: result.secure_url 
    });

  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ', 
      error: error.message 
    });
  }
});

// ดึงรายชื่อผู้ใช้ทั้งหมด
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    // ตรวจสอบว่าเรา select ข้อมูลที่อยู่ด้วย
    const users = await User.find({})
      .select('-password')
      .lean(); // ใช้ lean() เพื่อให้ได้ plain JavaScript objects

    console.log('Sample user address:', users[0]?.address); // เพิ่ม log เพื่อตรวจสอบ
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// ยืนยันผู้ใช้
router.put('/users/:id/verify', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    user.isVerified = true;
    await user.save();

    // บันทึกกิจกรรม
    await logActivity(
      'USER_VERIFY',
      `ยืนยันตัวตนผู้ใช้ ${user.name}`,
      { userId: user._id }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// อัพเดทบทบาทผู้ใช้
router.put('/users/:id/role', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    const oldRole = user.role;
    user.role = req.body.role;
    await user.save();

    // บันทึกกิจกรรม
    await logActivity(
      'USER_UPDATE',
      `เปลี่ยนบทบาทผู้ใช้ ${user.name} จาก ${oldRole} เป็น ${user.role}`,
      { userId: user._id }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// แก้ไขข้อมูลผู้ใช้ทั่วไป
router.put('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    const allowedUpdates = ['name', 'email', 'phone', 'address', 'profileImage', 'role', 'isVerified'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    // บันทึกกิจกรรม
    await logActivity(
      'USER_UPDATE',
      `อัพเดทข้อมูลผู้ใช้ ${user.name}`,
      { userId: user._id }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// ลบผู้ใช้
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    const userName = user.name; // เก็บชื่อไว้ก่อนลบ
    await User.deleteOne({ _id: req.params.id });

    // บันทึกกิจกรรม
    await logActivity(
      'USER_DELETE',
      `ลบผู้ใช้ ${userName}`,
      { userId: req.params.id }
    );

    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// สถิติระบบ
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    res.json({
      totalUsers,
      verifiedUsers,
      adminUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// เปลี่ยนรหัสผ่านผู้ใช้
router.put('/users/:id/password', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    // ตรวจสอบความยาวรหัสผ่านใหม่
    if (req.body.newPassword.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    // รหัสผ่านจะถูกแฮชอัตโนมัติโดย middleware ใน User model
    user.password = req.body.newPassword;
    await user.save();

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// เพิ่ม route สำหรับดึงข้อมูล dashboard stats
router.get('/dashboard-stats', protect, isAdmin, async (req, res) => {
  try {
    // ข้อมูลผู้ใช้
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    // ข้อมูลคำสั่งซื้อ
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const processingOrders = await Order.countDocuments({ orderStatus: 'processing' });
    const completedOrders = await Order.countDocuments({ orderStatus: 'completed' });
    
    // คำนวณยอดขายรวมจากออเดอร์ที่ชำระเงินแล้ว
    const paidOrders = await Order.find({ 
      paymentStatus: 'paid',  // ดูเฉพาะที่ชำระเงินแล้ว
      orderStatus: { $ne: 'cancelled' }  // ไม่รวมที่ยกเลิก
    });

    // log เพื่อตรวจสอบ
    console.log('Paid Orders:', paidOrders.map(order => ({
      id: order._id,
      amount: order.totalAmount,
      method: order.paymentMethod,
      status: order.paymentStatus
    })));

    const totalSales = paidOrders.reduce((sum, order) => {
      // log แต่ละรายการที่นำมาคำนวณ
      console.log(`Order ${order._id}: ${order.totalAmount} via ${order.paymentMethod}`);
      return sum + (order.totalAmount || 0);
    }, 0);

    // ข้อมูลสินค้า
    const lowStockThreshold = 10;
    const lowStockProducts = await Product.countDocuments({ 
      stock: { $lte: lowStockThreshold } 
    });
    const totalProducts = await Product.countDocuments();

    res.json({
      totalUsers,
      verifiedUsers,
      adminUsers,
      totalOrders: await Order.countDocuments({ orderStatus: { $ne: 'cancelled' } }), // ไม่รวมที่ยกเลิก
      pendingOrders,
      processingOrders,
      completedOrders,
      totalProducts,
      lowStockProducts,
      totalSales,
      // แยกยอดตามวิธีชำระเงิน เพื่อตรวจสอบ
      salesByMethod: {
        credit: paidOrders.filter(o => o.paymentMethod === 'credit')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        promptpay: paidOrders.filter(o => o.paymentMethod === 'promptpay')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        cash: paidOrders.filter(o => o.paymentMethod === 'cash')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// เพิ่ม route สำหรับดึงข้อมูลกิจกรรมล่าสุด
router.get('/activities', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Activity.countDocuments();

    res.json({
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// เพิ่ม route สำหรับดึงข้อมูลรายงาน
router.get('/reports', protect, isAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // ดึงข้อมูลยอดขายและจำนวนออเดอร์
    const todayData = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: today },
          orderStatus: { $ne: 'cancelled' },
          paymentStatus: 'paid'
        }
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]).then(result => result[0] || { total: 0, count: 0 });

    const weekData = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfWeek },
          orderStatus: { $ne: 'cancelled' },
          paymentStatus: 'paid'
        }
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]).then(result => result[0] || { total: 0, count: 0 });

    const monthData = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfMonth },
          orderStatus: { $ne: 'cancelled' },
          paymentStatus: 'paid'
        }
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]).then(result => result[0] || { total: 0, count: 0 });

    // ดึงข้อมูลสินค้าขายดี
    const topProducts = await Order.aggregate([
      { $match: { 
        orderStatus: { $ne: 'cancelled' },
        paymentStatus: 'paid'
      }},
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalAmount: { $sum: { $multiply: ['$items.price', '$items.quantity'] }}
      }},
      { $sort: { totalQuantity: -1 }},
      { $limit: 5 },
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $project: {
        name: '$product.name',
        image: { $arrayElemAt: ['$product.images', 0] },
        totalQuantity: 1,
        totalAmount: 1
      }}
    ]);

    res.json({
      sales: {
        today: todayData.total,
        thisWeek: weekData.total,
        thisMonth: monthData.total,
        todayOrders: todayData.count,
        weekOrders: weekData.count,
        monthOrders: monthData.count
      },
      topProducts
    });

  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// เพิ่ม route สำหรับดึงข้อมูลคำสั่งซื้อทั้งหมด
router.get('/orders', protect, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name price'
      })
      .sort('-createdAt')
      .lean();

    // แปลงข้อมูลให้ตรงกับ interface ที่ frontend ต้องการ
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      user: {
        name: order.user.name,
        email: order.user.email
      },
      items: order.items.map(item => ({
        product: {
          name: item.product.name,
          price: item.product.price
        },
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// เพิ่ม route สำหรับอัพเดทสถานะคำสั่งซื้อ
router.put('/orders/:id/status', protect, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = req.body.status;
    await order.save();

    // บันทึกกิจกรรม
    await logActivity(
      'ORDER_STATUS_CHANGE',
      `อัพเดทสถานะคำสั่งซื้อ #${order._id} จาก ${oldStatus} เป็น ${order.orderStatus}`,
      { orderId: order._id }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// เพิ่ม route สำหรับอัพเดทสถานะการชำระเงิน
router.put('/orders/:id/payment-status', protect, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }

    const oldStatus = order.paymentStatus;
    order.paymentStatus = req.body.status;
    
    // อัพเดท paidAt ถ้าสถานะเป็น paid
    if (req.body.status === 'paid' && !order.paidAt) {
      order.paidAt = new Date();
    }
    
    await order.save();

    // บันทึกกิจกรรม
    await logActivity(
      'PAYMENT_STATUS_CHANGE',
      `อัพเดทสถานะการชำระเงินคำสั่งซื้อ #${order._id} จาก ${oldStatus} เป็น ${order.paymentStatus}`,
      { orderId: order._id }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
});

// เพิ่ม middleware สำหรับบันทึกกิจกรรม
export const logActivity = async (type, message, data = null) => {
  try {
    const activity = new Activity({
      type,
      message,
      timestamp: new Date(),
      data
    });
    await activity.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export default router; 