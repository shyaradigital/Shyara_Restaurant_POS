import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'orderPlaced',
      'buttonClicked',
      'itemSelected',
      'customerTyping',
      'updateOrderStatus',
      'adminMessage',
      'statusUpdated',
      'adminEvent'
    ]
  },
  orderId: {
    type: String,
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Event', eventSchema);

