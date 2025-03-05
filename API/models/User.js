import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'กรุณากรอกชื่อ'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^[ก-์a-zA-Z0-9\s]{3,50}$/.test(v);
        },
        message: 'ชื่อต้องมีความยาว 3-50 ตัวอักษร และประกอบด้วยตัวอักษรภาษาไทย อังกฤษ หรือตัวเลขเท่านั้น'
      }
    },
    email: {
      type: String,
      required: [true, 'กรุณากรอกอีเมล'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          // ตรวจสอบรูปแบบอีเมลทั่วไป
          const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(v)) return false;

          // ตรวจสอบความยาวของส่วนต่างๆ
          const [localPart, domain] = v.split('@');
          if (localPart.length < 3 || localPart.length > 64) return false;
          if (domain.length < 4 || domain.length > 255) return false;

          // ตรวจสอบว่าไม่มีจุดติดกัน
          if (v.includes('..')) return false;

          // ตรวจสอบว่าไม่ขึ้นต้นหรือลงท้ายด้วยจุด
          if (localPart.startsWith('.') || localPart.endsWith('.')) return false;

          return true;
        },
        message: 'กรุณากรอกอีเมลให้ถูกต้อง เช่น example@domain.com'
      }
    },
    password: {
      type: String,
      required: [true, 'กรุณากรอกรหัสผ่าน'],
      minlength: [6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'],
      validate: {
        validator: function(v) {
          // ต้องมีตัวอักษรภาษาอังกฤษตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว
          // ต้องมีตัวอักษรภาษาอังกฤษตัวพิมพ์เล็กอย่างน้อย 1 ตัว
          // ต้องมีตัวเลขอย่างน้อย 1 ตัว
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(v);
        },
        message: 'รหัสผ่านต้องประกอบด้วยตัวอักษรภาษาอังกฤษพิมพ์ใหญ่อย่างน้อย 1 ตัว, ตัวพิมพ์เล็กอย่างน้อย 1 ตัว และตัวเลขอย่างน้อย 1 ตัว'
      }
    },
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // ถ้าไม่ได้กรอกเบอร์โทร ให้ผ่าน
          return /^0[0-9]{9}$/.test(v); // เบอร์โทรต้องขึ้นต้นด้วย 0 และมีตัวเลข 10 หลัก
        },
        message: 'เบอร์โทรศัพท์ไม่ถูกต้อง กรุณากรอกเบอร์โทรที่ขึ้นต้นด้วย 0 ตามด้วยตัวเลข 9 หลัก'
      }
    },
    address: {
      type: Object,
      default: {}
    },
    profileImage: {
      type: String,
      default: 'default.jpg'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// เข้ารหัสรหัสผ่านก่อนบันทึก
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// เพิ่มเมธอดสำหรับเปรียบเทียบรหัสผ่าน
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// เพิ่ม virtual field สำหรับ profileImageUrl
userSchema.virtual('profileImageUrl').get(function() {
  if (this.profileImage.startsWith('http')) {
    return this.profileImage;
  }
  return `${process.env.BASE_URL}/uploads/${this.profileImage}`;
});

// ไม่ส่งรหัสผ่านกลับไปยัง client
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

const User = mongoose.model("User", userSchema);
export default User;
