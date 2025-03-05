import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from './adminRoutes.js';

const router = express.Router();

// ลงทะเบียนผู้ใช้ใหม่
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    // สร้างผู้ใช้ใหม่
    const user = new User({
      name,
      email,
      password,
      phone
    });

    await user.save();

    // บันทึกกิจกรรม
    await logActivity(
      'USER_REGISTER',
      `ผู้ใช้ใหม่ ${user.name} ลงทะเบียน`,
      { userId: user._id }
    );

    // สร้าง token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
});

// เข้าสู่ระบบ
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ค้นหาผู้ใช้
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // บันทึกกิจกรรม
    await logActivity(
      'USER_LOGIN',
      `ผู้ใช้ ${user.name} เข้าสู่ระบบ`,
      { userId: user._id }
    );

    // สร้าง token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

export default router; 