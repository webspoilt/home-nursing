const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Lead Storage Database file path (lightweight production local DB)
const LEADS_FILE = path.join(__dirname, 'data', 'leads.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([]));
}

// API Endpoint to capture and log customer inquiries before forwarding
app.post('/api/inquiry', (req, res) => {
  try {
    const { name, phone, service, duration, location, notes, timestamp } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone are required.' });
    }

    const newLead = {
      id: 'LEAD-' + Date.now(),
      name,
      phone,
      service: service || 'General Nursing Inquiry',
      duration: duration || 'Not specified',
      location: location || 'Bangalore',
      notes: notes || '',
      receivedAt: timestamp || new Date().toISOString(),
      status: 'New'
    };

    // Save lead to persistent storage
    const rawData = fs.readFileSync(LEADS_FILE, 'utf8');
    const leads = JSON.parse(rawData || '[]');
    leads.unshift(newLead);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

    // Construct formatted WhatsApp redirect link
    const targetNumber = '919931450495';
    let waMessage = `*Hello EarthCone Home Nursing, I would like to book a service:*\n\n`;
    waMessage += `👤 *Name:* ${name}\n`;
    waMessage += `📞 *Contact Phone:* ${phone}\n`;
    waMessage += `🩺 *Service Required:* ${service}\n`;
    if (duration) waMessage += `⏱️ *Shift / Duration:* ${duration}\n`;
    waMessage += `📍 *Location in Bengaluru:* ${location}\n`;
    if (notes && notes.trim() !== '') waMessage += `📝 *Patient Notes:* ${notes.trim()}\n`;
    waMessage += `\n_Reference ID: ${newLead.id}_`;

    const encodedMessage = encodeURIComponent(waMessage);
    const waUrl = `https://wa.me/${targetNumber}?text=${encodedMessage}`;

    return res.status(200).json({
      success: true,
      message: 'Inquiry registered successfully',
      leadId: newLead.id,
      whatsappUrl: waUrl
    });

  } catch (error) {
    console.error('Lead processing error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing inquiry.' });
  }
});

// Admin endpoint to view captured leads (can be protected with API key)
app.get('/api/leads', (req, res) => {
  try {
    const rawData = fs.readFileSync(LEADS_FILE, 'utf8');
    const leads = JSON.parse(rawData || '[]');
    res.status(200).json({ count: leads.length, leads });
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve leads.' });
  }
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🩺 EarthCone Home Nursing Production Server is Running`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Leads API: http://localhost:${PORT}/api/leads`);
  console.log(`=======================================================`);
});
