/**
 * EarthCone Home Nursing - Interactive Client Experience Engine
 * Includes Cost Estimator, Quick Booking Modal, Toast Notifications,
 * Live Availability Indicators, and Auto-WhatsApp Routing.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Dynamic Year
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Scroll Progress Bar
  const progressBar = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0 && progressBar) {
      const progress = (window.scrollY / totalHeight) * 100;
      progressBar.style.width = `${progress}%`;
    }
  });

  // Mobile Menu Drawer
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Navbar background glass elevation
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 25) {
      navbar.classList.add('shadow-md', 'bg-white/95');
      navbar.classList.remove('bg-white/80');
    } else {
      navbar.classList.remove('shadow-md');
      navbar.classList.add('bg-white/80');
    }
  });

  // Interactive Care Cost & Plan Estimator
  const serviceSelect = document.getElementById('calc-service');
  const durationRadios = document.querySelectorAll('input[name="calc-duration"]');
  const nurseLevelRadios = document.querySelectorAll('input[name="calc-level"]');
  const estCostDisplay = document.getElementById('calc-estimate-cost');
  const calcBookBtn = document.getElementById('calc-whatsapp-btn');

  // Base pricing rate matrix (Bengaluru market standard)
  const baseRates = {
    'bedside': { 'visit': 650, '12hr': 1400, '24hr': 2400, 'monthly': 58000 },
    'elderly': { 'visit': 500, '12hr': 1200, '24hr': 2100, 'monthly': 48000 },
    'postop': { 'visit': 750, '12hr': 1500, '24hr': 2600, 'monthly': 62000 },
    'procedures': { 'visit': 450, '12hr': 1100, '24hr': 1900, 'monthly': 38000 },
    'physio': { 'visit': 900, '12hr': 1800, '24hr': 3200, 'monthly': 70000 },
    'palliative': { 'visit': 800, '12hr': 1600, '24hr': 2800, 'monthly': 65000 }
  };

  function updateEstimate() {
    if (!serviceSelect || !estCostDisplay) return;
    const selectedService = serviceSelect.value || 'bedside';
    let selectedDuration = '12hr';
    durationRadios.forEach(r => { if (r.checked) selectedDuration = r.value; });

    let levelMultiplier = 1.0;
    nurseLevelRadios.forEach(r => {
      if (r.checked && r.value === 'icu') levelMultiplier = 1.25;
    });

    const rates = baseRates[selectedService] || baseRates['bedside'];
    const base = rates[selectedDuration] || 1400;
    const calculatedPrice = Math.round(base * levelMultiplier);

    let priceFormatted = '';
    if (selectedDuration === 'monthly') {
      priceFormatted = `₹${calculatedPrice.toLocaleString('en-IN')} / month`;
    } else if (selectedDuration === 'visit') {
      priceFormatted = `₹${calculatedPrice.toLocaleString('en-IN')} / visit`;
    } else {
      priceFormatted = `₹${calculatedPrice.toLocaleString('en-IN')} / shift`;
    }

    estCostDisplay.textContent = priceFormatted;

    // Update WhatsApp link with the calculated estimate
    if (calcBookBtn) {
      const serviceName = serviceSelect.options[serviceSelect.selectedIndex].text;
      const message = `Hello EarthCone Home Nursing, I used the Care Estimator on your website for *${serviceName}* (${selectedDuration} shift). The estimated rate is ${priceFormatted}. I would like to confirm availability for BTM / Bengaluru.`;
      calcBookBtn.href = `https://wa.me/919931450495?text=${encodeURIComponent(message)}`;
    }
  }

  if (serviceSelect) serviceSelect.addEventListener('change', updateEstimate);
  durationRadios.forEach(r => r.addEventListener('change', updateEstimate));
  nurseLevelRadios.forEach(r => r.addEventListener('change', updateEstimate));
  updateEstimate();

  // Toast Notification Trigger
  function showToast(message, type = 'success') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 transform translate-y-[-100px] opacity-0 text-sm font-semibold';
      document.body.appendChild(toast);
    }

    if (type === 'success') {
      toast.className = 'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 text-sm font-semibold bg-slate-900 text-white border border-teal-500/40';
      toast.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i> <span>${message}</span>`;
    } else {
      toast.className = 'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 text-sm font-semibold bg-rose-900 text-white border border-rose-500/40';
      toast.innerHTML = `<i data-lucide="alert-circle" class="w-5 h-5 text-rose-300"></i> <span>${message}</span>`;
    }

    if (window.lucide) lucide.createIcons();

    // Animate In
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 50);

    // Animate Out after 3.5s
    setTimeout(() => {
      toast.style.transform = 'translateY(-100px)';
      toast.style.opacity = '0';
    }, 3500);
  }

  // Unified Lead Dispatcher (Saves to backend API & forwards to WhatsApp)
  async function dispatchInquiry(formData) {
    showToast('Preparing your personalized WhatsApp inquiry...');

    try {
      // Fire non-blocking API call to save in backend / data/leads.json
      fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).catch(e => console.log('Offline / Static mode: routing directly to WhatsApp'));

      // Generate direct WhatsApp link
      const targetNumber = '919931450495';
      let message = `*Hello EarthCone Home Nursing, I would like to book a service:*\n\n`;
      message += `👤 *Name:* ${formData.name}\n`;
      message += `📞 *Contact Phone:* ${formData.phone}\n`;
      message += `🩺 *Service Required:* ${formData.service}\n`;
      if (formData.duration) message += `⏱️ *Shift / Duration:* ${formData.duration}\n`;
      message += `📍 *Location in Bengaluru:* ${formData.location}\n`;
      if (formData.notes && formData.notes.trim() !== '') {
        message += `📝 *Patient Notes:* ${formData.notes.trim()}\n`;
      }
      message += `\n_Please confirm availability and share final quote._`;

      const waUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;

      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 600);

    } catch (err) {
      console.error(err);
    }
  }

  // Form Handlers
  const heroForm = document.getElementById('hero-quick-form');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('hero-name').value;
      const phone = document.getElementById('hero-phone').value;
      const service = document.getElementById('hero-service').value;
      const location = document.getElementById('hero-location').value;

      dispatchInquiry({ name, phone, service, location });
    });
  }

  const mainForm = document.getElementById('main-inquiry-form');
  if (mainForm) {
    mainForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('form-name').value;
      const phone = document.getElementById('form-phone').value;
      const service = document.getElementById('form-service').value;
      const duration = document.getElementById('form-duration').value;
      const location = document.getElementById('form-location').value;
      const notes = document.getElementById('form-notes').value;

      dispatchInquiry({ name, phone, service, duration, location, notes });
    });
  }

  // Modal Fast Booking Dialog
  const modal = document.getElementById('booking-modal');
  const modalOpenBtns = document.querySelectorAll('.open-modal-trigger');
  const modalCloseBtn = document.getElementById('close-modal-btn');
  const modalForm = document.getElementById('modal-booking-form');

  if (modal) {
    modalOpenBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const prefilledService = btn.getAttribute('data-service');
        if (prefilledService) {
          const modalServiceInput = document.getElementById('modal-service');
          if (modalServiceInput) modalServiceInput.value = prefilledService;
        }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      });
    });

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    });

    if (modalForm) {
      modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('modal-name').value;
        const phone = document.getElementById('modal-phone').value;
        const service = document.getElementById('modal-service').value;
        const location = document.getElementById('modal-location').value;

        modal.classList.add('hidden');
        modal.classList.remove('flex');
        dispatchInquiry({ name, phone, service, location });
      });
    }
  }

  // Interactive FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-accordion-btn');
  faqItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      const isExpanded = !content.classList.contains('hidden');

      // Close all others
      document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
      document.querySelectorAll('.faq-icon').forEach(i => i.style.transform = 'rotate(0deg)');

      if (!isExpanded) {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });

});
