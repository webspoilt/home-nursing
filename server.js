const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'earthcone-admin-2024';

// Database module
const {
  initDatabase,
  insertLead,
  insertInquiry,
  getAllLeads,
  getAllInquiries,
  getLeadCount,
  getInquiryCount
} = require('./db/database');

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Target WhatsApp number & Official Business Email
const TARGET_WHATSAPP = '919931450495';
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'earthconehomenursing@gmail.com';

// Helper: Forward to Google Sheets if webhook configured
async function forwardToGoogleSheets(payload) {
  const googleSheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (googleSheetUrl && googleSheetUrl.startsWith('http')) {
    try {
      await fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Google Sheet forward warning:', err.message);
    }
  }
}

// ── Lead Capture API (Used by Estimator Form & Chatbot) ──
app.post('/api/leads', (req, res) => {
  try {
    const { phone, email, service, source, name, details } = req.body;

    if (!phone || phone.replace(/\D/g, '').length < 8) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required.' });
    }

    const leadId = insertLead({
      phone: phone.trim(),
      email: (email || '').trim(),
      service: service || 'General Nursing Care',
      source: source || 'estimate-form'
    });

    // Forward to Google Sheets asynchronously
    forwardToGoogleSheets({
      leadId: `EC-${leadId}`,
      name: (name || 'Estimate Lead').trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      service: service || 'General Nursing Care',
      duration: '',
      location: 'Bengaluru',
      notes: details || '',
      source: source || 'estimate-form'
    });

    // Generate formatted WhatsApp handoff URL
    let waMsg = `*Hello EarthCone Home Nursing!* 💚\n`;
    waMsg += `I just requested an estimate on your website.\n\n`;
    if (name) waMsg += `👤 *Name:* ${name}\n`;
    waMsg += `📞 *Phone:* ${phone.trim()}\n`;
    if (email) waMsg += `✉️ *Email:* ${email.trim()}\n`;
    waMsg += `🩺 *Service:* ${service || 'General Nursing Care'}\n`;
    if (details) waMsg += `📝 *Details:* ${details}\n`;
    waMsg += `\n_Ref ID: EC-${leadId}_`;
    waMsg += `\n_Please share an estimate and care availability._`;

    const waUrl = `https://wa.me/${TARGET_WHATSAPP}?text=${encodeURIComponent(waMsg)}`;

    return res.status(200).json({
      success: true,
      message: 'Lead registered successfully in database.',
      leadId: `EC-${leadId}`,
      whatsappUrl: waUrl
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving lead.' });
  }
});

// ── Full Inquiry API (Hero Form, Contact Form, Chatbot) ──
app.post('/api/inquiry', (req, res) => {
  try {
    const { name, phone, service, duration, location, notes, source } = req.body;

    if (!phone || phone.replace(/\D/g, '').length < 8) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required.' });
    }

    const leadId = insertInquiry({
      name: (name || 'Customer').trim(),
      phone: phone.trim(),
      service: service || 'General Nursing Inquiry',
      duration: duration || '',
      location: location || 'Bengaluru',
      notes: notes || '',
      source: source || 'inquiry-form'
    });

    // Also store in leads table for consolidated sales follow-up
    try {
      insertLead({
        phone: phone.trim(),
        email: '',
        service: service || 'General Nursing Inquiry',
        source: source || 'inquiry-form'
      });
    } catch (e) {
      // safe fallback
    }

    // Also forward to Google Sheets asynchronously
    forwardToGoogleSheets({
      leadId: `EC-${leadId}`,
      name: (name || 'Customer').trim(),
      phone: phone.trim(),
      email: '',
      service: service || 'General Nursing Inquiry',
      duration: duration || '',
      location: location || 'Bengaluru',
      notes: notes || '',
      source: source || 'inquiry-form'
    });

    // WhatsApp Message
    let waMsg = `*Hello EarthCone Home Nursing, I would like to book a service:*\n\n`;
    waMsg += `👤 *Name:* ${(name || 'Customer').trim()}\n`;
    waMsg += `📞 *Contact:* ${phone.trim()}\n`;
    waMsg += `🩺 *Service:* ${service || 'General Nursing'}\n`;
    if (duration) waMsg += `⏱️ *Duration:* ${duration}\n`;
    if (location) waMsg += `📍 *Location:* ${location}\n`;
    if (notes && notes.trim()) waMsg += `📝 *Notes:* ${notes.trim()}\n`;
    waMsg += `\n_Ref: EC-${leadId}_`;

    const waUrl = `https://wa.me/${TARGET_WHATSAPP}?text=${encodeURIComponent(waMsg)}`;

    return res.status(200).json({
      success: true,
      message: 'Inquiry registered successfully in database.',
      leadId: `EC-${leadId}`,
      whatsappUrl: waUrl
    });

  } catch (error) {
    console.error('Inquiry error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing inquiry.' });
  }
});

// ── Admin: View Captured Leads & Inquiries ──
app.get('/api/leads', (req, res) => {
  const key = req.query.key || req.headers['x-api-key'];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Provide ?key=YOUR_KEY or x-api-key header.' });
  }

  try {
    const leads = getAllLeads();
    const inquiries = getAllInquiries();
    const leadCount = getLeadCount();
    const inquiryCount = getInquiryCount();

    res.status(200).json({
      summary: {
        totalLeads: leadCount,
        totalInquiries: inquiryCount,
        database: 'SQLite (sql.js persistent)'
      },
      leads,
      inquiries
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve leads from database.' });
  }
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server after initializing database
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`═════════════════════════════════════════════════════`);
      console.log(`🩺 EarthCone Home Nursing Production Server Running`);
      console.log(`🌐 URL:        http://localhost:${PORT}`);
      console.log(`📧 Email:      ${BUSINESS_EMAIL}`);
      console.log(`📊 Admin API:  http://localhost:${PORT}/api/leads?key=${ADMIN_KEY}`);
      console.log(`💾 Database:   SQLite (db/earthcone.db)`);
      console.log(`═════════════════════════════════════════════════════`);
    });
  } catch (err) {
    console.error('Fatal: Failed to initialize SQLite database:', err);
    process.exit(1);
  }
}

startServer();
