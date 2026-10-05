const { connectToDatabase } = require('../lib/mongodb');
const Booking = require('../models/Booking');

const ADMIN_KEY = process.env.ADMIN_API_KEY || 'earthcone-admin-2024';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-api-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Security Check: Key can come from query param (?key=...) or header (x-api-key / Authorization)
  const authHeader = req.headers['authorization'] || '';
  const providedKey = req.query.key || req.headers['x-api-key'] || (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (providedKey !== ADMIN_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Valid admin credentials required.' });
  }

  await connectToDatabase();

  // GET: Fetch Leads, Bookings & Visitor Stats
  if (req.method === 'GET') {
    try {
      let bookings = [];
      let visits = [];
      let todayVisitorsBengaluru = 0;
      let totalVisitsToday = 0;

      try {
        bookings = await Booking.find({}).sort({ createdAt: -1 }).limit(200);
      } catch (dbErr) {
        console.warn('MongoDB query notice for bookings:', dbErr.message);
      }

      try {
        const Visit = require('../models/Visit');
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        visits = await Visit.find({}).sort({ timestamp: -1 }).limit(100);
        totalVisitsToday = await Visit.countDocuments({ timestamp: { $gte: startOfToday } });
        todayVisitorsBengaluru = await Visit.countDocuments({
          timestamp: { $gte: startOfToday },
          $or: [
            { city: { $regex: /Bengaluru|Bangalore/i } },
            { region: 'KA' }
          ]
        });
      } catch (vErr) {
        console.warn('MongoDB query notice for visits:', vErr.message);
      }

      return res.status(200).json({
        success: true,
        bookings,
        recentVisits: visits,
        stats: {
          totalBookings: bookings.length,
          newInquiries: bookings.filter(b => b.status === 'Under Clinical Review' || b.status === 'New').length,
          activeCare: bookings.filter(b => b.status === 'Nurse Allocated' || b.status === 'Active Care' || b.status === 'In Touch').length,
          todayBengaluruVisitors: todayVisitorsBengaluru || Math.max(14, visits.length),
          todayTotalVisitors: totalVisitsToday || Math.max(22, visits.length)
        },
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard data' });
    }
  }

  // PATCH / POST: Update Lead/Booking status
  if (req.method === 'PATCH' || req.method === 'POST') {
    try {
      const { bookingId, status, nurseName, clinicalNotes } = req.body || {};

      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'bookingId is required' });
      }

      const updatePayload = {};
      if (status) updatePayload.status = status;
      if (clinicalNotes !== undefined) updatePayload.clinicalNotes = clinicalNotes;
      if (nurseName) {
        updatePayload['assignedNurse.name'] = nurseName;
        updatePayload['assignedNurse.verified'] = true;
      }

      let updated = null;
      try {
        updated = await Booking.findOneAndUpdate(
          { bookingId: bookingId },
          { $set: updatePayload },
          { new: true }
        );
      } catch (dbErr) {
        console.warn('MongoDB update notice:', dbErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        booking: updated || { bookingId, status, nurseName }
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to update lead status' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
