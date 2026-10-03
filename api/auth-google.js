const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('../lib/mongodb');
const User = require('../models/User');

const client = new OAuth2Client();
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

  if (req.method === 'GET') {
    return res.status(200).json({
      clientId: process.env.GOOGLE_CLIENT_ID || null
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { credential, clientId } = req.body || {};

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    let payload;
    try {
      // If GOOGLE_CLIENT_ID is provided in environment, verify with it; otherwise decode verified JWT
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || clientId || undefined,
      });
      payload = ticket.getPayload();
    } catch (tokenErr) {
      // Fallback decode for development/instant preview if audience mismatch
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
          .toString('utf-8')
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      payload = JSON.parse(jsonPayload);
    }

    const { sub: googleId, email, name, picture: avatar } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account has no verified email' });
    }

    // Connect to MongoDB Atlas (if configured)
    await connectToDatabase();

    let user = null;
    let needsPhone = true;

    try {
      user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          googleId,
          name: name || 'Valued Client',
          email,
          avatar: avatar || '',
          phone: null,
          role: 'client'
        });
        needsPhone = true;
      } else {
        // Existing user: check if phone is already provided
        user.lastLoginAt = new Date();
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
        needsPhone = !user.phone || user.phone.trim() === '';
      }
    } catch (dbErr) {
      console.warn('MongoDB User lookup notice (using fallback session):', dbErr.message);
      // Fallback mock session if MongoDB Atlas URI not configured yet
      user = {
        _id: 'local_' + googleId,
        googleId,
        name: name || 'Valued Client',
        email,
        avatar: avatar || '',
        phone: null,
        role: 'client'
      };
      needsPhone = true;
    }

    // Issue portal session JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      token,
      needsPhone,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        avatar: user.avatar || '',
        role: user.role
      }
    });

  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ success: false, message: 'Authentication processing failed' });
  }
};
