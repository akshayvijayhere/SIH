const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['critical', 'warning', 'info', 'resolved'] },
  category: { type: String, required: true },
  issue: { type: String, required: true },
  tagText: { type: String, required: true },
  state: { type: String, required: true },
  sector: { type: String, required: true },
  riskPercentage: { type: Number, required: true },
  timeAgo: { type: String, default: 'Just now' },
  escalationLevel: { 
    type: String, 
    default: 'Level 1: Nodal Officer',
    enum: ['Level 1: Nodal Officer', 'Level 2: Ministry Nodal Agency', 'Level 3: Cabinet Committee'] 
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
