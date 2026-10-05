const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  ip: { type: String, default: 'Unknown' },
  city: { type: String, default: 'Bengaluru' },
  region: { type: String, default: 'KA' },
  country: { type: String, default: 'IN' },
  coordinates: { type: String, default: '' },
  page: { type: String, default: '/' },
  referrer: { type: String, default: 'Direct' },
  screen: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.models.Visit || mongoose.model('Visit', visitSchema);
