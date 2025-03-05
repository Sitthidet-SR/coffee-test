import Activity from '../models/Activity.js';

// ฟังก์ชันสำหรับบันทึกกิจกรรม
export const logActivity = async (type, message, data = {}) => {
  try {
    const log = new Activity({
      type,
      message,
      data
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging activity:', error);
    // ถ้าเกิดข้อผิดพลาดในการบันทึก log ไม่ควรทำให้แอพหยุดทำงาน
    return null;
  }
};

export default logActivity; 