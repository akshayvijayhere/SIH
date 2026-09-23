const mongoose = require('mongoose');

const CauseAnalysisSchema = new mongoose.Schema({
  factor: { type: String, required: true },
  impact: { type: String, required: true }
});

const ProjectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  state: { type: String, required: true, index: true },
  city: { type: String },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  sector: { type: String, required: true, index: true },
  progress: { type: Number, required: true },
  riskScore: { type: Number, required: true, index: true },
  status: { type: String, required: true },
  statusClass: { type: String, required: true },
  estCompletion: { type: String },
  delayRisk: { type: Number, default: 0 },
  costRisk: { type: Number, default: 0 },
  agency: { type: String },
  contractor: { type: String },
  approvedBudget: { type: String },
  spentBudget: { type: String },
  milestone: { type: String },
  causeAnalysis: [CauseAnalysisSchema]
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
