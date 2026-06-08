const mongoose = require('mongoose')

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  message: {
    type: String,
    required: true
    // example: "Papa missed Metformin 500mg at 09:00"
  },
  isRead: {
    type: Boolean,
    default: false
    // false = red badge on dashboard
    // true = child has seen it
  }
}, { timestamps: true })

module.exports = mongoose.model('Alert', alertSchema)