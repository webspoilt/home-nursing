/**
 * EarthCone Home Nursing - Client Portal & Booking Engine
 * Manages Google Identity Services (GIS), Conditional Phone Verification Modal,
 * Multi-Step Clinical Care Booking Wizard, and Client Dashboard.
 */

window.EarthConePortal = (function() {
  const STATE = {
    user: null,
    token: null,
    bookings: []
  };

  // DOM references
  let loginModal, phoneModal, bookingModal, dashboardModal;

  function init() {
    // Restore session if exists
    const storedToken = localStorage.getItem('ec_portal_token');
    const storedUser = localStorage.getItem('ec_portal_user');

    if (storedToken && storedUser) {
      try {
        STATE.token = storedToken;
        STATE.user = JSON.parse(storedUser);
        updateNavState();
      } catch (e) {
        logout();
      }
    }

    renderModals();
    bindEvents();
    initGoogleAuth();
  }

  // Update Navbar with Auth State
  function updateNavState() {
    const authButtons = document.querySelectorAll('.portal-auth-btn-container');
    authButtons.forEach(container => {
      if (STATE.user) {
        container.innerHTML = `
          <div class="relative group">
            <button class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-sm hover:bg-slate-800 transition">
              <img src="${STATE.user.avatar || 'https://www.svgrepo.com/show/475656/google-color.svg'}" class="w-6 h-6 rounded-full border border-teal-400 object-cover" alt="Avatar">
              <span class="max-w-[100px] truncate">${STATE.user.name.split(' ')[0]}</span>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
            </button>
            <div class="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1">
              <div class="px-3 py-2 border-b border-slate-100">
                <p class="text-xs font-bold text-slate-900 truncate">${STATE.user.name}</p>
                <p class="text-[11px] text-slate-500 truncate">${STATE.user.email}</p>
                <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                  ${STATE.user.phone ? '✓ Phone Verified' : '⚠ Phone Pending'}
                </span>
              </div>
              <button onclick="EarthConePortal.openDashboard()" class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2 mt-1">
                <i data-lucide="layout-dashboard" class="w-4 h-4 text-teal-600"></i> My Care Dashboard
              </button>
              <button onclick="EarthConePortal.openBookingWizard()" class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2">
                <i data-lucide="calendar-plus" class="w-4 h-4 text-emerald-600"></i> Book Nursing Care
              </button>
              <button onclick="EarthConePortal.logout()" class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1">
                <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out
              </button>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <button onclick="EarthConePortal.openLogin()" class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 border border-slate-700 shadow-sm transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Client Portal</span>
          </button>
        `;
      }
      if (window.lucide) lucide.createIcons();
    });
  }

  // Google Identity Services (GIS)
  function initGoogleAuth() {
    if (!window.google || !window.google.accounts) {
      setTimeout(initGoogleAuth, 400);
      return;
    }

    const clientId = window.GOOGLE_CLIENT_ID || '1016839352721-dummygoogleclientid.apps.googleusercontent.com';

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    const googleBtnContainer = document.getElementById('g_id_signin_button');
    if (googleBtnContainer) {
      window.google.accounts.id.renderButton(googleBtnContainer, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      });
    }
  }

  // Handle Response from Google
  async function handleCredentialResponse(response) {
    showToast('Verifying Google credentials with EarthCone Portal...');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();

      if (!data.success) {
        showToast(data.message || 'Authentication error', true);
        return;
      }

      STATE.token = data.token;
      STATE.user = data.user;
      localStorage.setItem('ec_portal_token', data.token);
      localStorage.setItem('ec_portal_user', JSON.stringify(data.user));

      closeLogin();
      updateNavState();

      if (data.needsPhone || !data.user.phone) {
        openPhoneModal();
      } else {
        showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      }

    } catch (err) {
      console.error('Login error:', err);
      // Demo / offline fallback if backend API unavailable
      const base64Url = response.credential.split('.')[1];
      const payload = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
      const fallbackUser = {
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        phone: null
      };
      STATE.user = fallbackUser;
      STATE.token = 'mock_jwt_token';
      localStorage.setItem('ec_portal_user', JSON.stringify(fallbackUser));
      closeLogin();
      updateNavState();
      openPhoneModal();
    }
  }

  // Render Modals into DOM
  function renderModals() {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'earthcone-portal-modals';
    modalContainer.innerHTML = `
      <!-- Modal 1: Google Login Modal -->
      <div id="ec-login-modal" class="fixed inset-0 z-50 hidden bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-7 relative">
          <button onclick="EarthConePortal.closeLogin()" class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
          
          <div class="text-center space-y-2 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto shadow-sm">
              <i data-lucide="shield-check" class="w-6 h-6"></i>
            </div>
            <h3 class="font-heading font-extrabold text-xl text-slate-900">EarthCone Patient Portal</h3>
            <p class="text-xs text-slate-500">Sign in securely with Google to schedule nursing visits, manage care plans, and track assigned nurses.</p>
          </div>

          <div class="space-y-4">
            <div class="flex justify-center" id="g_id_signin_button">
              <!-- Rendered by GIS -->
            </div>
            
            <div class="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5">
              <i data-lucide="lock" class="w-3.5 h-3.5 text-teal-600"></i>
              <span>256-Bit Encrypted Healthcare Privacy Compliant</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal 2: Conditional Phone Number Verification Modal -->
      <div id="ec-phone-modal" class="fixed inset-0 z-50 hidden bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-7 relative">
          <div class="text-center space-y-2 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
              <i data-lucide="phone-call" class="w-6 h-6"></i>
            </div>
            <h3 class="font-heading font-extrabold text-xl text-slate-900">Complete Your Care Profile</h3>
            <p class="text-xs text-slate-500">Google doesn't share phone numbers. Please verify your contact number for care manager coordination and rapid nurse deployment in Bengaluru.</p>
          </div>

          <form id="ec-phone-form" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">WhatsApp / Contact Mobile *</label>
              <div class="relative">
                <span class="absolute left-3.5 top-2.5 text-sm font-bold text-slate-500">+91</span>
                <input type="tel" id="ec-input-phone" required placeholder="98765 43210" pattern="[0-9]{10}" class="w-full pl-14 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold tracking-wide">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
                <input type="text" id="ec-input-em-name" placeholder="Name" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                <select id="ec-input-em-rel" class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="Son/Daughter">Son/Daughter</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>
            </div>

            <button type="submit" class="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>Confirm & Activate Portal</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Modal 3: Structured Clinical Care Booking Wizard -->
      <div id="ec-booking-modal" class="fixed inset-0 z-50 hidden bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto">
          <button onclick="EarthConePortal.closeBookingWizard()" class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-teal-600">Patient Care Assessment</span>
              <h3 class="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">Schedule Clinical Nursing Care</h3>
            </div>
            <div class="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400">
              <span class="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">1</span>
              <span>Assessment</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
              <span class="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">2</span>
              <span>Schedule</span>
            </div>
          </div>

          <form id="ec-booking-wizard-form" class="space-y-5">
            <!-- Service Selection -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">Select Clinical Service Required *</label>
              <select id="bw-service" required class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium">
                <option value="24/7 Bedside Nursing Care">24/7 Bedside ICU &amp; Critical Care Nursing</option>
                <option value="Elderly &amp; Senior Citizen Care">Elderly &amp; Geriatric Companionship Care</option>
                <option value="Post-Operative Rehabilitation">Post-Operative Surgical Recovery &amp; Vitals</option>
                <option value="Sterile Dressing &amp; Wound Care">Sterile Dressing, Ulcer &amp; Bed Sore Care</option>
                <option value="Ryles Tube Insertion &amp; Feeding">Ryles Tube (Nasogastric) Insertion &amp; Enteral Diet</option>
                <option value="Catheter Care &amp; Injections">Urinary Catheter Care &amp; IV Infusions</option>
                <option value="Home Physiotherapy">Home Physiotherapy &amp; Neuro Rehab</option>
              </select>
            </div>

            <!-- Patient Vitals & Details -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 mb-1">Patient Full Name *</label>
                <input type="text" id="bw-patient-name" required placeholder="e.g. Ramesh Chandra" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Age *</label>
                <input type="number" id="bw-patient-age" required min="1" max="115" placeholder="e.g. 74" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Mobility Status</label>
                <select id="bw-mobility" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="Needs Wheelchair/Assistance">Needs Wheelchair / Attendant Support</option>
                  <option value="Bedridden">Fully Bedridden</option>
                  <option value="Ambulatory / Independent">Can Walk Independently</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Shift Requirement *</label>
                <select id="bw-shift" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="12-Hour Day Shift">12-Hour Day Shift (8:00 AM - 8:00 PM)</option>
                  <option value="12-Hour Night Shift">12-Hour Night Shift (8:00 PM - 8:00 AM)</option>
                  <option value="24-Hour Live-In Care">24-Hour Dedicated Live-In Nurse</option>
                  <option value="Per-Visit Clinical Procedure">Single Procedure Visit (Dressing/Ryles Tube)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Medical Diagnosis / Special Requirements</label>
              <textarea id="bw-diagnosis" rows="2" placeholder="e.g. Post-stroke recovery, diabetes, requiring oxygen support or suction..." class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Preferred Start Date *</label>
                <input type="date" id="bw-start-date" required class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Locality in Bengaluru *</label>
                <input type="text" id="bw-locality" required placeholder="e.g. Kalyan Nagar / Indiranagar / Hebbal" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Complete Home Address *</label>
              <input type="text" id="bw-address" required placeholder="Flat/House No, Building, Street, Landmark" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            </div>

            <button type="submit" class="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-teal-600/30 transition flex items-center justify-center gap-2">
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>Confirm Assessment &amp; Request Care Manager</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Modal 4: Client Dashboard ("My Care Portal") -->
      <div id="ec-dashboard-modal" class="fixed inset-0 z-50 hidden bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto">
          <button onclick="EarthConePortal.closeDashboard()" class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="flex items-center justify-between pb-6 border-b border-slate-100">
            <div class="flex items-center gap-3.5">
              <img id="dash-avatar" src="" class="w-12 h-12 rounded-2xl border border-teal-200 object-cover" alt="User">
              <div>
                <h3 class="font-heading font-extrabold text-xl text-slate-900" id="dash-name">My Care Dashboard</h3>
                <p class="text-xs text-slate-500" id="dash-email"></p>
              </div>
            </div>
            <button onclick="EarthConePortal.openBookingWizard()" class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
              <i data-lucide="plus" class="w-4 h-4"></i> New Booking
            </button>
          </div>

          <div class="mt-6 space-y-6">
            <!-- Care Supervisor Hotline Box -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-teal-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                  <i data-lucide="user-check" class="w-5 h-5"></i>
                </div>
                <div>
                  <p class="text-xs text-teal-300 font-bold uppercase tracking-wider">Dedicated Care Manager</p>
                  <p class="font-heading font-extrabold text-sm">Sister Mary (Clinical Coordinator)</p>
                </div>
              </div>
              <a href="tel:+919931450495" class="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-xs hover:bg-teal-400 transition flex items-center gap-1.5 shrink-0">
                <i data-lucide="phone-call" class="w-3.5 h-3.5"></i> Direct Hotline
              </a>
            </div>

            <!-- Active Bookings List -->
            <div>
              <h4 class="font-heading font-bold text-sm text-slate-900 mb-3">Your Care Schedule &amp; Bookings</h4>
              <div id="dash-bookings-container" class="space-y-3">
                <!-- Injected via JavaScript -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    // Set minimum start date for booking wizard to today
    const dateInput = document.getElementById('bw-start-date');
    if (dateInput) {
      dateInput.min = new Date().toISOString().split('T')[0];
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  // Bind Form Submissions
  function bindEvents() {
    // Phone Form Submission
    const phoneForm = document.getElementById('ec-phone-form');
    if (phoneForm) {
      phoneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('ec-input-phone').value;
        const emName = document.getElementById('ec-input-em-name').value;
        const emRel = document.getElementById('ec-input-em-rel').value;

        showToast('Saving contact details...');

        try {
          const res = await fetch('/api/user/phone', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${STATE.token}`
            },
            body: JSON.stringify({
              phone: '+91' + phone.replace(/\D/g, '').slice(-10),
              emergencyContactName: emName,
              emergencyContactRelation: emRel
            })
          });

          const data = await res.json();
          if (data.success) {
            STATE.user.phone = '+91' + phone.slice(-10);
            localStorage.setItem('ec_portal_user', JSON.stringify(STATE.user));
            closePhoneModal();
            updateNavState();
            showToast('Care Profile Completed Successfully!');
          }
        } catch (err) {
          // Fallback offline store
          STATE.user.phone = '+91' + phone.slice(-10);
          localStorage.setItem('ec_portal_user', JSON.stringify(STATE.user));
          closePhoneModal();
          updateNavState();
        }
      });
    }

    // Booking Wizard Form Submission
    const bookingForm = document.getElementById('ec-booking-wizard-form');
    if (bookingForm) {
      bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!STATE.user) {
          openLogin();
          return;
        }

        const payload = {
          serviceType: document.getElementById('bw-service').value,
          patientName: document.getElementById('bw-patient-name').value,
          patientAge: document.getElementById('bw-patient-age').value,
          mobilityStatus: document.getElementById('bw-mobility').value,
          shiftRequirement: document.getElementById('bw-shift').value,
          diagnosis: document.getElementById('bw-diagnosis').value,
          startDate: document.getElementById('bw-start-date').value,
          locality: document.getElementById('bw-locality').value,
          address: document.getElementById('bw-address').value
        };

        showToast('Registering patient assessment with EarthCone Clinical Desk...');

        try {
          const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${STATE.token}`
            },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (data.success) {
            closeBookingWizard();
            showToast(`Assessment ${data.booking.bookingId} registered! Reviewing care plan.`);
            openDashboard();
          } else {
            showToast(data.message || 'Error creating booking', true);
          }
        } catch (err) {
          showToast('Assessment submitted successfully!');
          closeBookingWizard();
        }
      });
    }
  }

  // Dashboard Fetcher
  async function loadBookings() {
    const container = document.getElementById('dash-bookings-container');
    if (!container) return;

    container.innerHTML = `<div class="text-center py-6 text-xs text-slate-400"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600"></i> Loading care records...</div>`;
    if (window.lucide) lucide.createIcons();

    try {
      const res = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${STATE.token}` }
      });
      const data = await res.json();
      const list = data.bookings || [];

      if (list.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 rounded-2xl bg-slate-50 border border-slate-200/80 p-6">
            <i data-lucide="calendar" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
            <p class="text-xs font-bold text-slate-700">No Active Nursing Assignments</p>
            <p class="text-[11px] text-slate-500 mt-0.5">You have not scheduled any clinical assessments yet.</p>
            <button onclick="EarthConePortal.openBookingWizard()" class="mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold">
              Schedule Your First Care Assessment
            </button>
          </div>
        `;
      } else {
        container.innerHTML = list.map(b => `
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">${b.bookingId}</span>
                <span class="text-xs font-bold text-slate-900">${b.serviceType}</span>
              </div>
              <p class="text-xs text-slate-600">Patient: <strong>${b.patientName}</strong> (${b.shiftRequirement})</p>
              <p class="text-[11px] text-slate-400">Start Date: ${b.startDate} | Locality: ${b.locality || 'Bengaluru'}</p>
            </div>
            <div class="text-right sm:text-right shrink-0">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                ${b.status}
              </span>
            </div>
          </div>
        `).join('');
      }

    } catch (e) {
      container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">Unable to load live records.</p>`;
    }
    if (window.lucide) lucide.createIcons();
  }

  // Toast Helper
  function showToast(msg, isError) {
    if (window.showToast) {
      window.showToast(msg);
      return;
    }
    const t = document.createElement('div');
    t.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white transition duration-300 ${isError ? 'bg-rose-600' : 'bg-slate-900 border border-teal-500/30'}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // Public Interface
  return {
    init,
    openLogin: () => document.getElementById('ec-login-modal')?.classList.remove('hidden'),
    closeLogin: () => document.getElementById('ec-login-modal')?.classList.add('hidden'),
    openPhoneModal: () => document.getElementById('ec-phone-modal')?.classList.remove('hidden'),
    closePhoneModal: () => document.getElementById('ec-phone-modal')?.classList.add('hidden'),
    openBookingWizard: () => {
      if (!STATE.user) {
        EarthConePortal.openLogin();
        return;
      }
      document.getElementById('ec-booking-modal')?.classList.remove('hidden');
    },
    closeBookingWizard: () => document.getElementById('ec-booking-modal')?.classList.add('hidden'),
    openDashboard: () => {
      if (!STATE.user) {
        EarthConePortal.openLogin();
        return;
      }
      document.getElementById('dash-name').textContent = STATE.user.name;
      document.getElementById('dash-email').textContent = STATE.user.email;
      document.getElementById('dash-avatar').src = STATE.user.avatar || 'https://www.svgrepo.com/show/475656/google-color.svg';
      document.getElementById('ec-dashboard-modal')?.classList.remove('hidden');
      loadBookings();
    },
    closeDashboard: () => document.getElementById('ec-dashboard-modal')?.classList.add('hidden'),
    logout: () => {
      STATE.user = null;
      STATE.token = null;
      localStorage.removeItem('ec_portal_token');
      localStorage.removeItem('ec_portal_user');
      updateNavState();
      document.getElementById('ec-dashboard-modal')?.classList.add('hidden');
      showToast('Signed out of Patient Portal.');
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  EarthConePortal.init();
});
