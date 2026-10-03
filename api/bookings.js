const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('../lib/mongodb');
const Booking = require('../models/Booking');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'earthcone-portal-jwt-secret-2024';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify Session Token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Client authorization token required' });
  }

  let decoded;
  try {
    const token = authHeader.split(' ')[1];
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }

  await connectToDatabase();

  // GET: Fetch all active & past bookings for this authenticated user
  if (req.method === 'GET') {
    try {
      const bookings = await Booking.find({ clientEmail: decoded.email }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, bookings });
    } catch (e) {
      return res.status(200).json({ success: true, bookings: [] });
    }
  }

  // POST: Create a structured clinical assessment & nursing booking
  if (req.method === 'POST') {
    try {
      const {
        serviceType,
        patientName,
        patientAge,
        patientGender,
        diagnosis,
        mobilityStatus,
        shiftRequirement,
        startDate,
        durationRequirement,
        address,
        locality,
        clinicalNotes
      } = req.body || {};

      if (!serviceType || !patientName || !address) {
        return res.status(400).json({ 
          success: false, 
          message: 'Service type, patient name, and home address are required' 
        });
      }

      // Fetch user phone from database or body
      let user = null;
      try {
        user = await User.findOne({ email: decoded.email });
      } catch (uErr) {}

      const clientPhone = (user && user.phone) ? user.phone : (req.body.phone || '+91');
      const bookingId = 'EC-' + Math.floor(10000 + Math.random() * 90000);

      const bookingData = {
        bookingId,
        userId: user ? user._id : undefined,
        clientEmail: decoded.email,
        clientPhone,
        clientName: decoded.name,
        serviceType,
        patientName,
        patientAge: Number(patientAge) || undefined,
        patientGender: patientGender || 'Unspecified',
        diagnosis: diagnosis || '',
        mobilityStatus: mobilityStatus || 'Needs Wheelchair/Assistance',
        shiftRequirement: shiftRequirement || '12-Hour Day Shift',
        startDate: startDate || new Date().toISOString().split('T')[0],
        durationRequirement: durationRequirement || 'Monthly / Ongoing',
        address,
        locality: locality || 'Bengaluru',
        clinicalNotes: clinicalNotes || '',
        status: 'Under Clinical Review',
        assignedCareManager: {
          name: 'Sister Mary (Clinical Lead)',
          phone: '+91 9931450495',
          email: 'earthconehomenursing@gmail.com'
        }
      };

      let savedBooking = null;
      try {
        savedBooking = await Booking.create(bookingData);
      } catch (dbErr) {
        console.warn('MongoDB save notice:', dbErr.message);
        savedBooking = bookingData;
      }

      // Sync to Google Sheets Live Spreadsheet
      const googleSheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbw4E1alIwDGS1dhuPaSZuXy-B3CL_zYX6Bp882Q-VHdXPRfmDPEPjOJZKOvvCB5Uq5ydw/exec';
      if (googleSheetUrl && googleSheetUrl.startsWith('http')) {
        try {
          await fetch(googleSheetUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              leadId: bookingId,
              name: decoded.name,
              phone: clientPhone,
              email: decoded.email,
              service: `${serviceType} (${shiftRequirement})`,
              duration: durationRequirement,
              location: `${locality}, ${address}`,
              notes: `Patient: ${patientName} (${patientAge || 'N/A'}y, ${patientGender}). Mobility: ${mobilityStatus}. Dx: ${diagnosis}. Notes: ${clinicalNotes}`,
              source: 'patient-care-portal',
              status: 'Under Clinical Review'
            })
          });
        } catch (sErr) {}
      }

      return res.status(201).json({
        success: true,
        message: 'Patient care booking registered successfully',
        booking: savedBooking
      });

    } catch (e) {
      console.error('Booking creation error:', e);
      return res.status(500).json({ success: false, message: 'Failed to create booking' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
