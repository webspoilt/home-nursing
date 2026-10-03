const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  clientEmail: { type: String, required: true, index: true },
  clientPhone: { type: String, required: true },
  clientName: { type: String, required: true },
  
  // Clinical Care Details
  serviceType: { type: String, required: true },
  patientName: { type: String, required: true },
  patientAge: { type: Number },
  patientGender: { type: String },
  diagnosis: { type: String, default: '' },
  mobilityStatus: { 
    type: String, 
    enum: ['Bedridden', 'Needs Wheelchair/Assistance', 'Ambulatory / Independent'], 
    default: 'Needs Wheelchair/Assistance' 
  },
  
  // Schedule
  shiftRequirement: { 
    type: String, 
    enum: ['12-Hour Day Shift', '12-Hour Night Shift', '24-Hour Live-In Care', 'Per-Visit Clinical Procedure'], 
    default: '12-Hour Day Shift' 
  },
  startDate: { type: String, required: true },
  durationRequirement: { type: String, default: 'Ongoing / Monthly' },
  address: { type: String, required: true },
  locality: { type: String, default: 'Bengaluru' },
  clinicalNotes: { type: String, default: '' },
  
  // Status & Care Manager
  status: { 
    type: String, 
    enum: ['Under Clinical Review', 'Care Manager Assigned', 'Nurse Allocated', 'Active Care', 'Completed', 'Cancelled'], 
    default: 'Under Clinical Review' 
  },
  assignedCareManager: {
    name: { type: String, default: 'Clinical Coordinator' },
    phone: { type: String, default: '+91 9931450495' },
    email: { type: String, default: 'earthconehomenursing@gmail.com' }
  },
  assignedNurse: {
    name: { type: String, default: '' },
    qualification: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
