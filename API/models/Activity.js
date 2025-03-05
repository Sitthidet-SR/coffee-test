import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'USER_REGISTER',
      'USER_LOGIN',
      'USER_UPDATE',
      'USER_DELETE',
      'USER_VERIFY',
      'NEW_ORDER',
      'ORDER_UPDATE',
      'ORDER_STATUS_CHANGE',
      'PRODUCT_CREATE',
      'PRODUCT_UPDATE',
      'PRODUCT_DELETE',
      'PRODUCT_STOCK_UPDATE'
    ]
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  data: mongoose.Schema.Types.Mixed
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity; 