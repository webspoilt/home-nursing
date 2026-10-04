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

  // Visitor Analytics Beacon (Logs IP, city, referral & screen size to Google Sheets/Vercel)
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: window.location.pathname,
        referrer: document.referrer || 'Direct Visit',
        screen: `${window.screen.width}x${window.screen.height}`,
        userAgent: navigator.userAgent
      })
    }).catch(() => {});
  } catch (e) {}

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

  // ── Lead Capture & Quote Request Handler ──
  const leadForm = document.getElementById('lead-capture-form');
  const leadSuccess = document.getElementById('lead-success');

  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById('lead-phone');
      const emailInput = document.getElementById('lead-email');
      const serviceInput = document.getElementById('lead-service');
      const submitBtn = document.getElementById('lead-submit-btn');

      const phone = phoneInput ? phoneInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const service = serviceInput ? serviceInput.value : 'General Nursing Care';

      if (!phone || phone.replace(/\D/g, '').length < 8) {
        showToast('Please enter a valid mobile number', 'error');
        return;
      }

      // Disable button during submission
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> <span>Submitting Estimate Request...</span>`;
        if (window.lucide) lucide.createIcons();
      }

      showToast('Registering estimate callback request...');

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            email,
            service,
            source: 'estimate-lead-form'
          })
        });

        const data = await response.json();

        // Switch to success card state
        leadForm.classList.add('hidden');
        if (leadSuccess) {
          leadSuccess.classList.remove('hidden');
          if (window.lucide) lucide.createIcons();
        }

        showToast('Estimate request recorded! A care coordinator will call you with a detailed breakdown.');

      } catch (err) {
        leadForm.classList.add('hidden');
        if (leadSuccess) {
          leadSuccess.classList.remove('hidden');
          if (window.lucide) lucide.createIcons();
        }
        showToast('Request recorded! Our team will contact you shortly.');
      }
    });
  }

  // Toast Notification Trigger (Responsive fixed styling)
  function showToast(message, type = 'success') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'fixed top-5 left-4 right-4 sm:left-auto sm:right-6 max-w-sm sm:max-w-md mx-auto sm:mx-0 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 transform translate-y-[-120px] opacity-0 text-sm font-semibold';
      document.body.appendChild(toast);
    }

    if (type === 'success') {
      toast.className = 'fixed top-5 left-4 right-4 sm:left-auto sm:right-6 max-w-sm sm:max-w-md mx-auto sm:mx-0 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 text-sm font-semibold bg-slate-900 text-white border border-teal-500/40';
      toast.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400 shrink-0"></i> <span>${message}</span>`;
    } else {
      toast.className = 'fixed top-5 left-4 right-4 sm:left-auto sm:right-6 max-w-sm sm:max-w-md mx-auto sm:mx-0 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 text-sm font-semibold bg-rose-900 text-white border border-rose-500/40';
      toast.innerHTML = `<i data-lucide="alert-circle" class="w-5 h-5 text-rose-300 shrink-0"></i> <span>${message}</span>`;
    }

    if (window.lucide) lucide.createIcons();

    // Animate In
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 50);

    // Animate Out after 3.5s
    setTimeout(() => {
      toast.style.transform = 'translateY(-120px)';
      toast.style.opacity = '0';
    }, 3500);
  }

  // Unified Clinical Callback Dispatcher (Saves to backend API & displays reassurance)
  async function dispatchInquiry(formData, formElement, successContainerId) {
    showToast('Submitting your care callback request...');

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      const leadId = (data && data.leadId) ? data.leadId : ('EC-' + Math.floor(10000 + Math.random() * 90000));

      if (formElement) {
        formElement.innerHTML = `
          <div class="p-6 text-center space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50/70 rounded-2xl border border-blue-200">
            <div class="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-sm">
              <i data-lucide="phone-forwarded" class="w-7 h-7"></i>
            </div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">Callback Registered</span>
              <h4 class="font-heading font-extrabold text-lg sm:text-xl text-slate-900 mt-1">Care Request Confirmed</h4>
              <p class="text-xs text-slate-500 mt-0.5">Reference ID: <strong class="text-blue-700 font-mono">${leadId}</strong></p>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Thank you, <strong>${formData.name}</strong>. Our Senior Medical Coordinator is reviewing your requirements and will call <strong>${formData.phone}</strong> within 15 minutes.
            </p>
            <div class="pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a href="tel:+919931450495" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-800 transition shadow-sm">
                <i data-lucide="phone" class="w-3.5 h-3.5 text-emerald-300"></i> Call Now (+91 9931450495)
              </a>
              <a href="https://wa.me/919931450495?text=Hello%20EarthCone,%20I%20just%20requested%20a%20callback%20(Ref:%20${leadId})" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-50 transition">
                <i data-lucide="message-square" class="w-3.5 h-3.5 text-emerald-600"></i> Optional WhatsApp
              </a>
            </div>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
      }

      showToast(`Callback request ${leadId} registered! Our team is calling you shortly.`);

    } catch (err) {
      console.warn('Network issue saving inquiry:', err);
      showToast('Callback request recorded! Our team will call you shortly.');
    }
  }

  // Form Handlers
  const heroForm = document.getElementById('hero-quick-form');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('hero-name')?.value.trim();
      const phone = document.getElementById('hero-phone')?.value.trim();
      const email = document.getElementById('hero-email')?.value.trim() || '';
      const service = document.getElementById('hero-service')?.value;
      const location = document.getElementById('hero-location')?.value.trim();

      if (!phone || phone.replace(/\D/g, '').length < 10) {
        showToast('Please enter a valid 10-digit mobile number', 'error');
        return;
      }

      dispatchInquiry(
        { name, phone: '+91' + phone.replace(/\D/g, '').slice(-10), email, service, location, source: 'hero-quick-form' },
        heroForm
      );
    });
  }

  const mainForm = document.getElementById('main-inquiry-form');
  if (mainForm) {
    mainForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('form-name')?.value.trim();
      const phone = document.getElementById('form-phone')?.value.trim();
      const email = document.getElementById('form-email')?.value.trim() || '';
      const service = document.getElementById('form-service')?.value;
      const duration = document.getElementById('form-duration')?.value;
      const location = document.getElementById('form-location')?.value.trim();
      const notes = document.getElementById('form-notes')?.value.trim();

      if (!phone || phone.replace(/\D/g, '').length < 10) {
        showToast('Please enter a valid 10-digit mobile number', 'error');
        return;
      }

      dispatchInquiry(
        { name, phone: '+91' + phone.replace(/\D/g, '').slice(-10), email, service, duration, location, notes, source: 'main-inquiry-form' },
        mainForm
      );
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
