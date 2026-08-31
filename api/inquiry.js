// Vercel Serverless Function for Lead Intake & WhatsApp formulation
module.exports = async (req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, service, duration, location, notes } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone number are required.' });
    }

    const leadId = 'EC-' + Date.now().toString(36).toUpperCase();
    const targetNumber = '919931450495';

    let waMessage = `*Hello EarthCone Home Nursing, I would like to book a service:*\n\n`;
    waMessage += `👤 *Name:* ${name}\n`;
    waMessage += `📞 *Contact Phone:* ${phone}\n`;
    waMessage += `🩺 *Service Required:* ${service || 'General Inquiries'}\n`;
    if (duration) waMessage += `⏱️ *Shift / Duration:* ${duration}\n`;
    waMessage += `📍 *Location in Bengaluru:* ${location || 'Bengaluru'}\n`;
    if (notes && notes.trim() !== '') waMessage += `📝 *Patient Notes:* ${notes.trim()}\n`;
    waMessage += `\n_Reference ID: ${leadId}_`;

    const encodedMessage = encodeURIComponent(waMessage);
    const waUrl = `https://wa.me/${targetNumber}?text=${encodedMessage}`;

    return res.status(200).json({
      success: true,
      leadId,
      whatsappUrl: waUrl
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error processing request.' });
  }
};
