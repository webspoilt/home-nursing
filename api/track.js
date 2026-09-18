// Vercel Serverless Function to track visitor analytics (IP, city/country, referrer, page)
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { page, referrer, screen, userAgent } = req.body || {};

    // Extract real client IP and Geo headers supplied automatically by Vercel Edge Network
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'Unknown IP';
    const clientIp = ip.split(',')[0].trim();
    const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : 'Bengaluru';
    const region = req.headers['x-vercel-ip-country-region'] || 'KA';
    const country = req.headers['x-vercel-ip-country'] || 'IN';
    const latitude = req.headers['x-vercel-ip-latitude'] || '';
    const longitude = req.headers['x-vercel-ip-longitude'] || '';

    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbw4E1alIwDGS1dhuPaSZuXy-B3CL_zYX6Bp882Q-VHdXPRfmDPEPjOJZKOvvCB5Uq5ydw/exec';

    if (googleSheetUrl && googleSheetUrl.startsWith('http')) {
      try {
        await fetch(googleSheetUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            type: 'visit',
            ip: clientIp,
            city: `${city}, ${region} (${country})`,
            coordinates: latitude && longitude ? `${latitude}, ${longitude}` : '',
            page: page || '/',
            referrer: referrer || 'Direct',
            screen: screen || 'Unknown',
            userAgent: userAgent || req.headers['user-agent'] || ''
          })
        });
      } catch (err) {
        console.warn('Analytics webhook notice:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      city,
      country,
      ip: clientIp
    });

  } catch (error) {
    return res.status(200).json({ success: false }); // never break client UX
  }
};
