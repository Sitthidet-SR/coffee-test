import express from "express";
import cors from "cors"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import path from "path";
import dotenv from 'dotenv';
import fs from 'fs';
import { logActivity } from "../utils/logActivity.js";

dotenv.config();

const router = express.Router();

// ตั้งค่า CORS options
const corsOptions = {
  origin: function(origin, callback) {
    // อนุญาตให้เข้าถึงจากทุก origin ในโหมด development
    const allowedOrigins = [
      'http://localhost:4200',
      'http://localhost:4000',
      'http://localhost:3000',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:3000'
    ];
    
    // อนุญาต requests ที่ไม่มี origin (เช่น mobile apps) หรือ origin ที่อยู่ในรายการที่อนุญาต
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// ใช้ CORS middleware
router.use(cors(corsOptions));

// เพิ่ม OPTIONS handler สำหรับ preflight requests
router.options('*', cors(corsOptions));

// Rate Limiting for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per 15 minutes
  message: { message: "Too many login attempts, please try again later." }
});

// ตรวจสอบว่ามีการตั้งค่า Cloudinary credentials ครบหรือไม่
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary credentials in environment variables');
  process.exit(1);
}

// คอนฟิก Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// กำหนดที่เก็บไฟล์ชั่วคราว
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// สร้าง multer instance
const uploadMiddleware = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024  // เพิ่มขนาดเป็น 10MB
  },
  fileFilter: (req, file, cb) => {
    // สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (!file) {
      cb(null, true);
      return;
    }
    
    // ตรวจสอบประเภทไฟล์
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น'), false);
    }
  }
});

// เพิ่ม error handling middleware
const uploadWithErrorHandling = (req, res, next) => {
  console.log('Starting file upload...');
  
  // สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
  const uploadDir = 'uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  uploadMiddleware.single('profileImage')(req, res, (err) => {
    console.log('Upload middleware executed');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'ไฟล์มีขนาดใหญ่เกินไป กรุณาอัพโหลดไฟล์ขนาดไม่เกิน 10MB'
        });
      }
      return res.status(400).json({
        message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์',
        error: err.message
      });
    } else if (err) {
      console.error('Other error:', err);
      return res.status(400).json({
        message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์',
        error: err.message
      });
    }
    next();
  });
};

// ฟังก์ชันส่งอีเมล
const sendEmail = async (email, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email sending failed");
  }
};

// ✅ สมัครสมาชิก
router.post("/register", uploadWithErrorHandling, async (req, res) => {
  try {
    console.log('Received registration request:', {
      ...req.body,
      file: req.file ? 'File received' : 'No file'
    });
    
    const { name, email, password, phone } = req.body;
    let address = req.body.address;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        details: {
          name: !name ? 'กรุณากรอกชื่อ' : null,
          email: !email ? 'กรุณากรอกอีเมล' : null,
          password: !password ? 'กรุณากรอกรหัสผ่าน' : null
        }
      });
    }

    // ตรวจสอบว่ามีผู้ใช้อีเมลนี้แล้วหรือไม่
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    let profileImageUrl = '';
    if (req.file) {
      try {
        console.log('Uploading file to Cloudinary...');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'user_profiles',
          width: 500,
          height: 500,
          crop: 'fill',
          quality: 'auto'
        });
        profileImageUrl = result.secure_url;
        console.log('File uploaded successfully:', profileImageUrl);
        
        // ลบไฟล์หลังจากอัพโหลดเสร็จ
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
          message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ',
          error: error.message
        });
      }
    }

    // แปลง address เป็น object
    let addressObj = {};
    if (address) {
      try {
        addressObj = typeof address === 'string' ? JSON.parse(address) : address;
      } catch (e) {
        console.error('Error parsing address:', e);
      }
    }

    // สร้าง user ใหม่
    const user = new User({
      name,
      email,
      password,
      phone: phone || '',
      address: addressObj,
      profileImage: profileImageUrl || 'default.jpg',
      isVerified: false
    });

    // บันทึกข้อมูล
    await user.save();
    console.log('User saved successfully:', {
      id: user._id,
      name: user.name,
      email: user.email
    });

    // สร้าง verification token
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // สร้าง verification URL
    const verificationUrl = `${process.env.CLIENT_URL}/api/verify-email?token=${verificationToken}`;

    // ส่งอีเมลยืนยัน
    try {
      await sendEmail(
        email,
        'ยืนยันการสมัครสมาชิก - Jack Coffee',
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ยืนยันการสมัครสมาชิก - Jack Coffee</title>
          <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Prompt', sans-serif; background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Main Container -->
            <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header Banner -->
              <div style="background-color: #4F3621; padding: 40px 20px; text-align: center;">
                <img src="https://i.ibb.co/9tvVQx7/logo.png" alt="Jack Coffee Logo" 
                     style="width: 120px; height: auto; margin-bottom: 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                  ยินดีต้อนรับสู่ Jack Coffee
                </h1>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                  สวัสดีคุณ ${name},
                </p>
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                  ขอบคุณที่สมัครสมาชิกกับ Jack Coffee เพื่อเริ่มต้นการใช้งาน กรุณายืนยันอีเมลของคุณโดยคลิกที่ปุ่มด้านล่าง
                </p>

                <!-- Verification Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${verificationUrl}" 
                     style="display: inline-block;
                            background-color: #C17817;
                            color: white;
                            padding: 15px 40px;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 600;
                            font-size: 16px;
                            transition: background-color 0.3s ease;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ยืนยันอีเมล
                  </a>
                </div>

                <!-- Security Notice -->
                <div style="background-color: #FFF9F0; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #C17817; margin: 0 0 10px; font-size: 16px; font-weight: 600;">
                    ⚠️ หมายเหตุเพื่อความปลอดภัย
                  </h3>
                  <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li>ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง</li>
                    <li>หากคุณไม่ได้ทำการสมัครสมาชิก กรุณาละเว้นอีเมลนี้</li>
                    <li>อย่าส่งต่อหรือแชร์ลิงก์นี้กับผู้อื่น</li>
                  </ul>
                </div>

                <!-- Alternative Link -->
                <div style="margin-top: 30px; padding: 20px; background-color: #F8F8F8; border-radius: 8px;">
                  <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">
                    หากคุณไม่สามารถคลิกที่ปุ่มได้ กรุณาคัดลอกลิงก์ด้านล่างไปวางในเว็บเบราว์เซอร์:
                  </p>
                  <p style="background-color: #ffffff; padding: 10px; border-radius: 4px; margin: 0; word-break: break-all;">
                    <a href="${verificationUrl}" 
                       style="color: #C17817; font-size: 14px; text-decoration: none;">
                      ${verificationUrl}
                    </a>
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #4F3621; padding: 30px 20px; text-align: center;">
                <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
                  © ${new Date().getFullYear()} Jack Coffee. All rights reserved.
                </p>
                <p style="color: #BFA38A; font-size: 12px; margin: 0;">
                  อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
                </p>
                <div style="margin-top: 20px;">
                  <a href="#" style="color: #BFA38A; text-decoration: none; font-size: 12px; margin: 0 10px;">
                    เงื่อนไขการใช้งาน
                  </a>
                  <a href="#" style="color: #BFA38A; text-decoration: none; font-size: 12px; margin: 0 10px;">
                    นโยบายความเป็นส่วนตัว
                  </a>
                  <a href="#" style="color: #BFA38A; text-decoration: none; font-size: 12px; margin: 0 10px;">
                    ติดต่อเรา
                  </a>
                </div>
              </div>
            </div>

            <!-- App Download Links (Optional) -->
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 15px;">
                ดาวน์โหลดแอปพลิเคชัน Jack Coffee ได้แล้ววันนี้
              </p>
              <div>
                <a href="#" style="display: inline-block; margin: 0 5px;">
                  <img src="https://i.ibb.co/9tvVQx7/app-store.png" alt="Download on App Store" 
                       style="height: 40px; width: auto;">
                </a>
                <a href="#" style="display: inline-block; margin: 0 5px;">
                  <img src="https://i.ibb.co/9tvVQx7/play-store.png" alt="Get it on Google Play" 
                       style="height: 40px; width: auto;">
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
        `
      );

      console.log('Verification email sent successfully');
    } catch (error) {
      console.error('Error sending verification email:', error);
      // ไม่ต้อง return error response เพราะผู้ใช้ได้ถูกสร้างแล้ว
      // แต่เราจะ log ไว้เพื่อการตรวจสอบ
    }

    // ส่งการตอบกลับ
    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลของท่านเพื่อยืนยันการสมัครสมาชิก',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
      error: error.message 
    });
  }
});

// ✅ ล็อกอิน
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    if (!user.isVerified) return res.status(400).json({ message: "Please verify your email first" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage } });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ ยืนยันอีเมล
router.get("/api/verify-email", async (req, res) => {
  try {
    console.log('เริ่มกระบวนการยืนยันอีเมล');
    const { token } = req.query;

    if (!token) {
      console.log('ไม่พบ token ในคำขอ');
      return res.status(400).json({ 
        success: false,
        message: "ไม่พบ token สำหรับยืนยันอีเมล" 
      });
    }

    console.log('กำลังตรวจสอบ token:', token);

    // ตรวจสอบและถอดรหัส token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('ถอดรหัส token สำเร็จ:', decoded);
    } catch (jwtError) {
      console.error('เกิดข้อผิดพลาดในการถอดรหัส token:', jwtError);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: "ลิงก์ยืนยันอีเมลหมดอายุ กรุณาขอลิงก์ใหม่",
          expired: true
        });
      }
      
      return res.status(400).json({
        success: false,
        message: "token ไม่ถูกต้อง กรุณาตรวจสอบลิงก์ยืนยันอีเมล",
        invalid: true
      });
    }
    
    if (!decoded.email || !decoded.userId) {
      console.log('token ไม่มีข้อมูลที่จำเป็น');
      return res.status(400).json({ 
        success: false,
        message: "token ไม่ถูกต้อง ไม่พบข้อมูลที่จำเป็น" 
      });
    }

    // ค้นหาผู้ใช้
    console.log('กำลังค้นหาผู้ใช้:', decoded.userId, decoded.email);
    const user = await User.findOne({ 
      _id: decoded.userId,
      email: decoded.email 
    });

    if (!user) {
      console.log('ไม่พบบัญชีผู้ใช้');
      return res.status(404).json({ 
        success: false,
        message: "ไม่พบบัญชีผู้ใช้ กรุณาตรวจสอบอีเมลอีกครั้ง" 
      });
    }

    if (user.isVerified) {
      console.log('อีเมลได้รับการยืนยันแล้ว');
      return res.status(200).json({ 
        success: true,
        message: "อีเมลนี้ได้รับการยืนยันแล้ว คุณสามารถเข้าสู่ระบบได้ทันที",
        alreadyVerified: true
      });
    }

    // อัพเดทสถานะการยืนยันอีเมล
    console.log('กำลังอัพเดทสถานะการยืนยันอีเมล');
    user.isVerified = true;
    await user.save();

    // บันทึกกิจกรรม
    await logActivity(
      'EMAIL_VERIFIED',
      `ผู้ใช้ ${user.name} ยืนยันอีเมลสำเร็จ`,
      { userId: user._id }
    );

    console.log('ยืนยันอีเมลสำเร็จ');
    res.status(200).json({ 
      success: true,
      message: "ยืนยันอีเมลสำเร็จ คุณสามารถเข้าสู่ระบบได้ทันที",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการยืนยันอีเมล:', error);
    
    res.status(500).json({ 
      success: false,
      message: "เกิดข้อผิดพลาดในการยืนยันอีเมล กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ",
      error: error.message 
    });
  }
});

// ✅ ขอรีเซ็ตรหัสผ่าน
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "ไม่พบอีเมลนี้ในระบบ" });

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await sendEmail(
      email,
      "รีเซ็ตรหัสผ่าน - Jack Coffee",
      `
      <div style="background-color: #f7f7f7; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 40px;">
          <!-- Header with Logo -->
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://i.ibb.co/9tvVQx7/logo.png" alt="Jack Coffee Logo" style="width: 150px; height: auto;">
            <h1 style="color: #4a5568; margin: 20px 0 10px; font-family: 'Prompt', sans-serif;">รีเซ็ตรหัสผ่าน</h1>
          </div>

          <!-- Content -->
          <div style="color: #4a5568; font-family: 'Prompt', sans-serif; font-size: 16px; line-height: 1.6;">
            <p style="margin-bottom: 20px;">เรียนคุณ ${user.name},</p>
            <p style="margin-bottom: 20px;">เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี Jack Coffee ของคุณ หากคุณไม่ได้ทำการร้องขอ กรุณาละเว้นอีเมลนี้</p>
            <p style="margin-bottom: 25px;">คลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>

            <!-- Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block;
                        background-color: #f59e0b;
                        color: white;
                        padding: 14px 30px;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                        font-size: 16px;
                        transition: background-color 0.3s ease;">
                รีเซ็ตรหัสผ่าน
              </a>
            </div>

            <!-- Security Notice -->
            <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                <strong>หมายเหตุเพื่อความปลอดภัย:</strong>
                <br>• ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง
                <br>• หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน โปรดติดต่อเราทันที
              </p>
            </div>

            <!-- Help Text -->
            <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
              หากคุณมีปัญหาในการคลิกปุ่ม "รีเซ็ตรหัสผ่าน" คุณสามารถคัดลอกและวาง URL ด้านล่างนี้ลงในเว็บเบราว์เซอร์ของคุณ:
              <br>
              <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              © ${new Date().getFullYear()} Jack Coffee. All rights reserved.
              <br>
              <span style="color: #94a3b8;">อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ</span>
            </p>
          </div>
        </div>
      </div>
      `
    );
    res.json({ message: "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว" });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
  }
});

// ✅ รีเซ็ตรหัสผ่าน
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email: decoded.email }, { password: hashedPassword });
    res.json({ message: "Password reset successful!" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

// ✅ ดึงข้อมูลผู้ใช้ (ต้องใช้ Token)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ อัพโหลดรูปโปรไฟล์
router.post("/upload-profile", protect, uploadWithErrorHandling, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    }

    const result = await cloudinary.uploader.upload(req.file.path);
    
    await User.findByIdAndUpdate(req.user.id, {
      profileImage: result.secure_url
    });

    res.json({ 
      message: 'อัพเดทรูปโปรไฟล์สำเร็จ',
      profileImage: result.secure_url 
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ',
      error: error.message 
    });
  }
});

// ✅ ลบรูปโปรไฟล์ (ใช้รูป default)
router.delete("/remove-profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // ถ้ามีรูปโปรไฟล์ที่ไม่ใช่รูป default
    if (user.profileImage !== "default.jpg") {
      // ดึง public_id จาก Cloudinary URL
      const publicId = user.profileImage.split("/").pop().split(".")[0];
      
      // ลบรูปจาก Cloudinary
      await cloudinary.uploader.destroy(`user_profiles/${publicId}`);
      
      // อัพเดทกลับเป็นรูป default
      await User.findByIdAndUpdate(
        req.user.id,
        { profileImage: "default.jpg" },
        { new: true }
      );
    }
    
    const updatedUser = await User.findById(req.user.id).select("-password");
    res.json({ 
      message: "ลบรูปโปรไฟล์สำเร็จ", 
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ อัพเดทข้อมูลผู้ใช้
router.put("/update", protect, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    let address = req.body.address;

    // แปลง address จาก string เป็น object ถ้าจำเป็น
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch (e) {
        console.error('Error parsing address:', e);
        address = {};
      }
    }

    // ตรวจสอบว่ามีผู้ใช้อีเมลนี้แล้วหรือไม่ (ยกเว้นผู้ใช้ปัจจุบัน)
    const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    // อัพเดทข้อมูล
    user.name = name;
    user.email = email;
    user.phone = phone || '';
    user.address = address || {};

    await user.save();

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล',
      error: error.message 
    });
  }
});

// ✅ เปลี่ยนรหัสผ่าน
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // ตรวจสอบว่ามีข้อมูลครบหรือไม่
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    // ตรวจสอบความยาวรหัสผ่านใหม่
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    // ค้นหาผู้ใช้
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    // เปลี่ยนรหัสผ่าน
    user.password = newPassword;
    await user.save();

    // บันทึกกิจกรรม
    await logActivity(
      'USER_UPDATE',
      `ผู้ใช้ ${user.name} เปลี่ยนรหัสผ่าน`,
      { userId: user._id }
    );

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
});

// ✅ ส่งลิงก์ยืนยันอีเมลใหม่
router.post("/api/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "กรุณากรอกอีเมล" });
    }

    // ค้นหาผู้ใช้จากอีเมล
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "อีเมลนี้ได้รับการยืนยันแล้ว" });
    }

    // สร้าง verification token ใหม่
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // สร้าง verification URL
    const verificationUrl = `${process.env.CLIENT_URL}/api/verify-email?token=${verificationToken}`;

    // ส่งอีเมลยืนยันใหม่
    await sendEmail(
      email,
      'ยืนยันการสมัครสมาชิก - Jack Coffee',
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ยืนยันการสมัครสมาชิก - Jack Coffee</title>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Prompt', sans-serif; background-color: #f7f7f7;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Main Container -->
          <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header Banner -->
            <div style="background-color: #4F3621; padding: 40px 20px; text-align: center;">
              <img src="https://i.ibb.co/9tvVQx7/logo.png" alt="Jack Coffee Logo" 
                   style="width: 120px; height: auto; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                ยืนยันอีเมลอีกครั้ง
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                สวัสดีคุณ ${user.name},
              </p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                นี่คือลิงก์ยืนยันอีเมลใหม่สำหรับบัญชี Jack Coffee ของคุณ กรุณาคลิกที่ปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ
              </p>

              <!-- Verification Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block;
                          background-color: #C17817;
                          color: white;
                          padding: 15px 40px;
                          text-decoration: none;
                          border-radius: 8px;
                          font-weight: 600;
                          font-size: 16px;
                          transition: background-color 0.3s ease;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ยืนยันอีเมล
                </a>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #FFF9F0; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #C17817; margin: 0 0 10px; font-size: 16px; font-weight: 600;">
                  ⚠️ หมายเหตุเพื่อความปลอดภัย
                </h3>
                <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง</li>
                  <li>หากคุณไม่ได้ขอลิงก์ยืนยันอีเมลใหม่ กรุณาละเว้นอีเมลนี้</li>
                  <li>อย่าส่งต่อหรือแชร์ลิงก์นี้กับผู้อื่น</li>
                </ul>
              </div>

              <!-- Alternative Link -->
              <div style="margin-top: 30px; padding: 20px; background-color: #F8F8F8; border-radius: 8px;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">
                  หากคุณไม่สามารถคลิกที่ปุ่มได้ กรุณาคัดลอกลิงก์ด้านล่างไปวางในเว็บเบราว์เซอร์:
                </p>
                <p style="background-color: #ffffff; padding: 10px; border-radius: 4px; margin: 0; word-break: break-all;">
                  <a href="${verificationUrl}" 
                     style="color: #C17817; font-size: 14px; text-decoration: none;">
                    ${verificationUrl}
                  </a>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #4F3621; padding: 30px 20px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
                © ${new Date().getFullYear()} Jack Coffee. All rights reserved.
              </p>
              <p style="color: #BFA38A; font-size: 12px; margin: 0;">
                อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
              </p>
              <div style="margin-top: 20px;">
                <a href="#" style="color: #BFA38A; text-decoration: none; font-size: 12px; margin: 0 10px;">
                  เงื่อนไขการใช้งาน
                </a>
                <a href="#" style="color: #BFA38A; text-decoration: none; font-size: 12px; margin: 0 10px;">
                  นโยบายความเป็นส่วนตัว
                </a>
                <a href="#" style="color: #BFA38A; text-decoration: none; font-size: 12px; margin: 0 10px;">
                  ติดต่อเรา
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
      `
    );

    res.json({ 
      message: "ส่งลิงก์ยืนยันอีเมลใหม่เรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของท่าน",
      email: user.email
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ 
      message: "เกิดข้อผิดพลาดในการส่งลิงก์ยืนยันอีเมล กรุณาลองใหม่อีกครั้ง",
      error: error.message 
    });
  }
});

// 🧪 สร้าง token สำหรับทดสอบ (เฉพาะ development)
router.get("/api/verify-email/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // ค้นหาผู้ใช้จากอีเมล
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        message: "ไม่พบผู้ใช้ที่มีอีเมลนี้" 
      });
    }

    // สร้าง verification token
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // สร้าง verification URL
    const verificationUrl = `${process.env.CLIENT_URL}/api/verify-email?token=${verificationToken}`;

    res.json({
      message: "สร้าง token สำหรับทดสอบสำเร็จ",
      verificationUrl,
      token: verificationToken
    });

  } catch (error) {
    console.error('Test verify email error:', error);
    res.status(500).json({ 
      message: "เกิดข้อผิดพลาดในการสร้าง token",
      error: error.message 
    });
  }
});

export default router;