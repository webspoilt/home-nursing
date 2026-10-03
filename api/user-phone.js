const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('../lib/mongodb');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'earthcone-portal-jwt-secret-2024';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify Bearer Token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token required' });
  }

  let decoded;
  try {
    const token = authHeader.split(' ')[1];
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }

  await connectToDatabase();

  // GET: Fetch user profile
  if (req.method === 'GET') {
    try {
      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        return res.status(200).json({
          success: true,
          user: { email: decoded.email, name: decoded.name, phone: null }
        });
      }
      return res.status(200).json({ success: true, user });
    } catch (e) {
      return res.status(200).json({ success: true, user: decoded });
    }
  }

  // POST/PUT: Update Phone & Emergency Contact
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { phone, emergencyContactName, emergencyContactRelation, emergencyContactPhone } = req.body || {};

      if (!phone || phone.replace(/\D/g, '').length < 8) {
        return res.status(400).json({ success: false, message: 'Valid phone number is required' });
      }

      let user = await User.findOne({ email: decoded.email });

      if (user) {
        user.phone = phone.trim();
        if (emergencyContactName) {
          user.emergencyContact = {
            name: emergencyContactName.trim(),
            relation: emergencyContactRelation || 'Family',
            phone: emergencyContactPhone ? emergencyContactPhone.trim() : ''
          };
        }
        await user.save();
      }

      // Also forward lead to Google Sheet webhook
      const googleSheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbw4E1alIwDGS1dhuPaSZuXy-B3CL_zYX6Bp882Q-VHdXPRfmDPEPjOJZKOvvCB5Uq5ydw/exec';
      if (googleSheetUrl && googleSheetUrl.startsWith('http')) {
        try {
          await fetch(googleSheetUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              leadId: 'EC-USER-' + Date.now().toString(36).toUpperCase(),
              name: decoded.name,
              phone: phone.trim(),
              email: decoded.email,
              service: 'Client Portal Registration (Verified)',
              duration: '',
              location: 'Bengaluru',
              notes: 'Phone verified via Google Auth Portal',
              source: 'portal-login'
            })
          });
        } catch (sErr) {}
      }

      return res.status(200).json({
        success: true,
        message: 'Phone number verified successfully',
        user: user || { email: decoded.email, phone }
      });

    } catch (e) {
      console.error('Update phone error:', e);
      return res.status(500).json({ success: false, message: 'Failed to update phone' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
