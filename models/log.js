const mongoose = require('mongoose')

const logSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
    // stores the time like "09:00"
  },
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed'],
    default: 'pending'
  },
  respondedAt: {
    type: Date,
    default: null
    // null until elder actually responds
    // future goal: used to calculate response time patterns
  },
  date: {
    type: String,
    required: true
    // stores date like "2026-05-21"
    // why string not Date? → makes querying "all logs for today" very simple
    // just match date === today's date string
  }
}, { timestamps: true })

module.exports = mongoose.model('Log', logSchema)