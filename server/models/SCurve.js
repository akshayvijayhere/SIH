const mongoose = require('mongoose');

const SCurveSchema = new mongoose.Schema({
  key: { type: String, default: 'mospi_portfolio_scurve', unique: true },
  labels: [{ type: String }],
  planned: [{ type: Number }],
  actualPhysical: [{ type: Number }],
  financialSpent: [{ type: Number }]
}, { timestamps: true });

module.exports = mongoose.model('SCurve', SCurveSchema);
