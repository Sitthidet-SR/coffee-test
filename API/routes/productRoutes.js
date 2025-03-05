import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ คอนฟิก Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ กำหนดที่เก็บไฟล์ด้วย Cloudinary สำหรับรูปสินค้า
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product_images",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }]
  }
});

// ✅ สร้าง multer instance สำหรับอัพโหลดรูปสินค้า
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ที่ 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("เฉพาะไฟล์รูปภาพเท่านั้น"), false);
    }
  }
});

// ✅ เพิ่ม CORS Middleware
router.use(cors());

// ✅ อัพโหลดรูปสินค้า (เฉพาะ Admin)
router.post("/upload-images", protect, admin, upload.array("productImages", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "กรุณาอัพโหลดรูปภาพอย่างน้อย 1 รูป" });
    }
    
    // สร้างอาเรย์ URL ของรูปที่อัพโหลด
    const imageUrls = req.files.map(file => file.path);
    
    res.json({ 
      message: "อัพโหลดรูปสินค้าสำเร็จ", 
      images: imageUrls 
    });
  } catch (error) {
    console.error("Error uploading product images:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ เพิ่มสินค้า (เฉพาะ Admin)
router.post("/", protect, admin, async (req, res) => {
  try {
    const { name, description, price, category, stock, images, discountPrice, tags } = req.body;
    
    if (!name || !description || !price || !category || !stock || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบ name, description, price, category, stock และ images (array)" });
    }
    
    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      images,
      discountPrice: discountPrice || null,
      tags: tags || [],
      createdBy: req.user._id,
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ ดึงสินค้าทั้งหมด
router.get("/", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sort, search, active, limit } = req.query;
    
    // สร้างเงื่อนไขค้นหา
    const filter = {};
    
    // กรองตามหมวดหมู่
    if (category) filter.category = category;
    
    // กรองตามช่วงราคา
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }
    
    // กรองตามการค้นหา (ชื่อสินค้าหรือคำอธิบาย)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // กรองตามสถานะการใช้งาน
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    
    // กำหนดการเรียงลำดับ
    let sortOption = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      // เรียงตามวันที่เพิ่มล่าสุดเป็นค่าเริ่มต้น
      sortOption = { createdAt: -1 };
    }
    
    // เพิ่ม limit query
    const query = Product.find(filter).sort(sortOption);
    if (limit) {
      query.limit(Number(limit));
    }
    
    const products = await query;
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ ดึงสินค้าเดี่ยว
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ อัปเดตสินค้า (เฉพาะ Admin)
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    // ดึงข้อมูลเดิมที่จะอัปเดต
    const oldImages = product.images;
    
    // อัปเดตข้อมูลสินค้า
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    // ถ้ามีการเปลี่ยนแปลงรูปภาพ ลบรูปเก่าจาก Cloudinary
    if (req.body.images && JSON.stringify(oldImages) !== JSON.stringify(req.body.images)) {
      // หารูปที่ไม่ได้ใช้แล้ว (มีในเก่าแต่ไม่มีในใหม่)
      const removedImages = oldImages.filter(oldImg => !req.body.images.includes(oldImg));
      
      // ลบรูปที่ไม่ได้ใช้จาก Cloudinary
      for (const imgUrl of removedImages) {
        // ดึง public_id จาก URL
        const publicId = imgUrl.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`product_images/${publicId}`);
        } catch (error) {
          console.error("Error deleting image from Cloudinary:", error);
        }
      }
    }
    
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ ลบสินค้า (เฉพาะ Admin)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    // ลบรูปภาพจาก Cloudinary
    for (const imgUrl of product.images) {
      // ดึง public_id จาก URL
      const publicId = imgUrl.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`product_images/${publicId}`);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
    }
    
    // ลบข้อมูลสินค้าจากฐานข้อมูล
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ เพิ่มรีวิวสินค้า
router.post("/:id/reviews", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // ตรวจสอบว่าผู้ใช้เคยรีวิวสินค้านี้แล้วหรือไม่
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user.id.toString()
    );
    
    if (alreadyReviewed) {
      return res.status(400).json({ message: "คุณได้รีวิวสินค้านี้ไปแล้ว" });
    }
    
    // สร้างรีวิวใหม่
    const review = {
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };
    
    // เพิ่มรีวิวใหม่
    product.reviews.push(review);
    
    // อัปเดตจำนวนรีวิวและคะแนนเฉลี่ย
    product.numReviews = product.reviews.length;
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    
    // บันทึกการเปลี่ยนแปลง
    await product.save();
    
    res.status(201).json({ message: "รีวิวถูกเพิ่มเรียบร้อยแล้ว", review });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ ค้นหาสินค้า
router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('name description price images ratings numReviews')
    .limit(10);

    res.json(products);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching products' });
  }
});

export default router;