/**
 * EarthCone Home Nursing - Guided Chat Bot Widget
 * Multi-step option-based flow → WhatsApp handoff with all details.
 */
(function () {
  'use strict';

  const WA_NUMBER = '919931450495';

  // ── Chat Flow Steps ──
  const steps = [
    {
      id: 'welcome',
      message: 'Hi there! 👋 Welcome to EarthCone Home Nursing. How can we help you today?',
      options: [
        { label: '🩺 I need nursing care', value: 'Need Nursing Care' },
        { label: '💰 Get a cost estimate', value: 'Cost Estimate' },
        { label: '📞 Talk to someone now', value: 'Talk Now' }
      ]
    },
    {
      id: 'service',
      message: 'What type of care are you looking for?',
      options: [
        { label: '🏥 Bedside / ICU Nursing', value: 'Bedside / ICU Nursing' },
        { label: '👴 Elderly & Senior Care', value: 'Elderly & Senior Care' },
        { label: '🩹 Post-Surgery Recovery', value: 'Post-Surgery Recovery' },
        { label: '🩸 Sterile Dressing & Wound Care', value: 'Sterile Dressing & Wound Care' },
        { label: '🩺 Ryles Tube Insertion & Feeding', value: 'Ryles Tube Insertion & Feeding' },
        { label: '💉 Injections / IV / Drips', value: 'Injections / IV / Drips' },
        { label: '🧑‍⚕️ Physiotherapy', value: 'Physiotherapy' },
        { label: '🫶 Palliative & Chronic Care', value: 'Palliative & Chronic Care' }
      ]
    },
    {
      id: 'patient',
      message: 'Who is the patient?',
      options: [
        { label: '🙋 Myself', value: 'Self' },
        { label: '👨‍👩‍👦 Parent / In-Law', value: 'Parent / In-Law' },
        { label: '💑 Spouse / Partner', value: 'Spouse / Partner' },
        { label: '👶 Child', value: 'Child' },
        { label: '👤 Other family / friend', value: 'Other' }
      ]
    },
    {
      id: 'shift',
      message: 'What shift / duration do you need?',
      options: [
        { label: '🌅 Day Shift (12 hrs)', value: '12-Hour Day Shift' },
        { label: '🌙 Night Shift (12 hrs)', value: '12-Hour Night Shift' },
        { label: '🕐 24-Hour Care', value: '24-Hour Care' },
        { label: '📋 Single Visit', value: 'Single Visit' },
        { label: '📆 Monthly (Live-in)', value: 'Monthly Live-In' }
      ]
    },
    {
      id: 'area',
      message: 'Which area in Bengaluru?',
      options: [
        { label: '📍 All Over Bengaluru', value: 'All Over Bengaluru' },
        { label: '📍 North Bengaluru', value: 'North Bengaluru' },
        { label: '📍 South Bengaluru', value: 'South Bengaluru' },
        { label: '📍 East Bengaluru', value: 'East Bengaluru' },
        { label: '📍 West Bengaluru', value: 'West Bengaluru' },
        { label: '📍 Central Bengaluru', value: 'Central Bengaluru' },
        { label: '📍 Other Bengaluru Locality', value: 'Other Bengaluru Locality' }
      ]
    },
    {
      id: 'name',
      message: 'Great! What is your name?',
      input: { type: 'text', placeholder: 'Enter your name' }
    },
    {
      id: 'phone',
      message: 'And your contact number?',
      input: { type: 'tel', placeholder: 'e.g. 9876543210' }
    }
  ];

  // ── State ──
  let currentStep = 0;
  let answers = {};
  let isOpen = false;

  // ── Build DOM ──
  function createWidget() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
      #ec-chatbot-toggle {
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(135deg, #0a2540, #034ea1);
        color: #fff; border: none; cursor: pointer;
        box-shadow: 0 6px 24px rgba(3,78,161,0.45);
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s ease;
        animation: ec-pulse 2s infinite;
      }
      #ec-chatbot-toggle:hover { transform: scale(1.08); }
      #ec-chatbot-toggle svg { width: 26px; height: 26px; }
      #ec-chatbot-toggle.open { animation: none; background: #1e293b; }
      @keyframes ec-pulse {
        0%, 100% { box-shadow: 0 6px 24px rgba(3,78,161,0.4); }
        50% { box-shadow: 0 6px 36px rgba(3,78,161,0.65), 0 0 0 10px rgba(3,78,161,0.12); }
      }

      #ec-chatbot-panel {
        position: fixed; bottom: 100px; right: 24px; z-index: 9998;
        width: 370px; max-width: calc(100vw - 32px);
        max-height: min(530px, calc(100dvh - 120px));
        background: #fff; border-radius: 20px;
        box-shadow: 0 25px 60px -12px rgba(0,0,0,0.25);
        display: flex; flex-direction: column;
        overflow: hidden;
        transform: scale(0.8) translateY(20px);
        opacity: 0; pointer-events: none;
        transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      }
      #ec-chatbot-panel.open {
        transform: scale(1) translateY(0);
        opacity: 1; pointer-events: auto;
      }

      .ec-header {
        background: linear-gradient(135deg, #0d9488, #0284c7);
        color: #fff; padding: 18px 20px;
        display: flex; align-items: center; gap: 12px;
        flex-shrink: 0;
      }
      .ec-header-icon {
        width: 40px; height: 40px; border-radius: 12px;
        background: rgba(255,255,255,0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; flex-shrink: 0;
      }
      .ec-header-text h3 {
        margin: 0; font-size: 15px; font-weight: 700;
      }
      .ec-header-text p {
        margin: 2px 0 0; font-size: 11px; opacity: 0.85;
      }

      .ec-chat-body {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 12px;
        scroll-behavior: smooth;
      }

      .ec-msg {
        max-width: 88%; padding: 12px 16px;
        border-radius: 16px; font-size: 13.5px; line-height: 1.5;
        animation: ec-fadeUp 0.3s ease;
      }
      .ec-msg.bot {
        background: #f0fdfa; color: #134e4a;
        border: 1px solid #ccfbf1;
        border-bottom-left-radius: 4px;
        align-self: flex-start;
      }
      .ec-msg.user {
        background: linear-gradient(135deg, #0d9488, #0284c7);
        color: #fff;
        border-bottom-right-radius: 4px;
        align-self: flex-end;
      }

      @keyframes ec-fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .ec-options {
        display: flex; flex-direction: column; gap: 8px;
        animation: ec-fadeUp 0.35s ease;
      }
      .ec-opt-btn {
        width: 100%; text-align: left;
        padding: 11px 16px; border-radius: 12px;
        background: #fff; color: #334155;
        border: 1.5px solid #e2e8f0;
        font-size: 13.5px; font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      }
      .ec-opt-btn:hover {
        background: #f0fdfa; border-color: #0d9488;
        color: #0d9488; transform: translateX(4px);
      }

      .ec-input-row {
        display: flex; gap: 8px; padding: 0;
        animation: ec-fadeUp 0.35s ease;
      }
      .ec-input-row input {
        flex: 1; padding: 11px 14px;
        border: 1.5px solid #e2e8f0; border-radius: 12px;
        font-size: 16px; outline: none;
        font-family: inherit; color: #334155;
        transition: border-color 0.2s;
      }
      .ec-input-row input:focus { border-color: #0d9488; }
      .ec-input-row button {
        padding: 0 16px; border: none; border-radius: 12px;
        background: linear-gradient(135deg, #0d9488, #0284c7);
        color: #fff; font-weight: 700; cursor: pointer;
        font-size: 14px; transition: opacity 0.2s;
        font-family: inherit;
      }
      .ec-input-row button:hover { opacity: 0.9; }

      .ec-wa-btn {
        display: flex; align-items: center; justify-content: center;
        gap: 10px; width: 100%; padding: 14px;
        border: none; border-radius: 14px;
        background: #25D366; color: #fff;
        font-size: 15px; font-weight: 700;
        cursor: pointer; transition: all 0.2s;
        font-family: inherit;
        animation: ec-fadeUp 0.35s ease;
      }
      .ec-wa-btn:hover { background: #1fb855; transform: scale(1.02); }
      .ec-wa-btn svg { width: 22px; height: 22px; fill: #fff; }

      .ec-restart {
        display: block; margin: 8px auto 0; padding: 8px 18px;
        border: 1.5px solid #e2e8f0; border-radius: 10px;
        background: transparent; color: #94a3b8;
        font-size: 12px; font-weight: 600; cursor: pointer;
        font-family: inherit; transition: all 0.2s;
      }
      .ec-restart:hover { color: #0d9488; border-color: #0d9488; }

      .ec-typing {
        display: flex; gap: 4px; padding: 10px 16px;
        align-self: flex-start;
      }
      .ec-typing span {
        width: 8px; height: 8px; border-radius: 50%;
        background: #94a3b8;
        animation: ec-bounce 1.4s infinite ease-in-out both;
      }
      .ec-typing span:nth-child(2) { animation-delay: 0.16s; }
      .ec-typing span:nth-child(3) { animation-delay: 0.32s; }
      @keyframes ec-bounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }

      #ec-greeting-bubble {
        position: fixed; bottom: 92px; right: 24px; z-index: 9997;
        background: #fff; color: #334155;
        padding: 14px 18px; border-radius: 16px;
        border-bottom-right-radius: 4px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        font-size: 14px; font-weight: 600; line-height: 1.4;
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        max-width: 260px;
        transform: scale(0.8) translateY(10px);
        opacity: 0; pointer-events: none;
        transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
        cursor: pointer;
      }
      #ec-greeting-bubble.show {
        transform: scale(1) translateY(0);
        opacity: 1; pointer-events: auto;
      }
      #ec-greeting-bubble .ec-close-greet {
        position: absolute; top: 4px; right: 8px;
        background: none; border: none; color: #94a3b8;
        font-size: 16px; cursor: pointer; line-height: 1;
      }

      @media (max-width: 420px) {
        #ec-chatbot-panel { right: 8px; bottom: 90px; width: calc(100vw - 16px); }
        #ec-chatbot-toggle { bottom: 18px; right: 18px; width: 54px; height: 54px; }
        #ec-greeting-bubble { right: 18px; bottom: 80px; max-width: 220px; font-size: 13px; }
      }
    `;
    document.head.appendChild(style);

    // Toggle Button (replaces old WhatsApp FAB)
    const toggle = document.createElement('button');
    toggle.id = 'ec-chatbot-toggle';
    toggle.setAttribute('aria-label', 'Open Chat Assistant');
    toggle.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`;
    document.body.appendChild(toggle);

    // Chat Panel
    const panel = document.createElement('div');
    panel.id = 'ec-chatbot-panel';
    panel.innerHTML = `
      <div class="ec-header">
        <div class="ec-header-icon">🏥</div>
        <div class="ec-header-text">
          <h3>EarthCone Care Assistant</h3>
          <p>Typically replies instantly</p>
        </div>
      </div>
      <div class="ec-chat-body" id="ec-chat-body"></div>
    `;
    document.body.appendChild(panel);

    // Events
    toggle.addEventListener('click', () => {
      openChat(toggle, panel);
    });

    // Greeting Bubble
    const greeting = document.createElement('div');
    greeting.id = 'ec-greeting-bubble';
    greeting.innerHTML = `
      <button class="ec-close-greet" aria-label="Close">&times;</button>
      👋 Hi! Need help finding the right nursing care? I can assist you!`;
    document.body.appendChild(greeting);

    // Close greeting bubble (X button)
    greeting.querySelector('.ec-close-greet').addEventListener('click', (e) => {
      e.stopPropagation();
      greeting.classList.remove('show');
    });

    // Click greeting bubble → open chatbot
    greeting.addEventListener('click', () => {
      greeting.classList.remove('show');
      if (!isOpen) openChat(toggle, panel);
    });

    // Auto-show greeting bubble after 2 seconds
    setTimeout(() => {
      if (!isOpen) greeting.classList.add('show');
    }, 2000);

    // Auto-open chatbot after 5 seconds if still not opened
    setTimeout(() => {
      if (!isOpen) {
        greeting.classList.remove('show');
        openChat(toggle, panel);
      }
    }, 5000);
  }

  function openChat(toggle, panel) {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    toggle.classList.toggle('open', isOpen);
    // Hide greeting bubble when chat is open
    const greeting = document.getElementById('ec-greeting-bubble');
    if (greeting && isOpen) greeting.classList.remove('show');
    toggle.innerHTML = isOpen
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    if (isOpen && currentStep === 0 && document.getElementById('ec-chat-body').children.length === 0) {
      startChat();
    }
  }

  // ── Chat Logic ──
  const body = () => document.getElementById('ec-chat-body');

  function scrollBottom() {
    const b = body();
    if (b) setTimeout(() => { b.scrollTop = b.scrollHeight; }, 60);
  }

  function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'ec-msg bot';
    div.textContent = text;
    body().appendChild(div);
    scrollBottom();
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'ec-msg user';
    div.textContent = text;
    body().appendChild(div);
    scrollBottom();
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'ec-typing';
    div.id = 'ec-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    body().appendChild(div);
    scrollBottom();
  }

  function hideTyping() {
    const t = document.getElementById('ec-typing');
    if (t) t.remove();
  }

  function showOptions(options, onSelect) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ec-options';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'ec-opt-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        wrapper.remove();
        addUserMessage(opt.label);
        onSelect(opt.value);
      });
      wrapper.appendChild(btn);
    });
    body().appendChild(wrapper);
    scrollBottom();
  }

  function showInput(config, onSubmit) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ec-input-row';
    const input = document.createElement('input');
    input.type = config.type || 'text';
    input.placeholder = config.placeholder || '';
    input.autocomplete = config.type === 'tel' ? 'tel' : 'name';
    const btn = document.createElement('button');
    btn.textContent = '→';
    const submit = () => {
      const val = input.value.trim();
      if (!val) { input.style.borderColor = '#ef4444'; return; }
      wrapper.remove();
      addUserMessage(val);
      onSubmit(val);
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    wrapper.appendChild(input);
    wrapper.appendChild(btn);
    body().appendChild(wrapper);
    scrollBottom();
    setTimeout(() => input.focus(), 100);
  }

  function processStep() {
    const step = steps[currentStep];
    if (!step) return;

    // Special shortcut: "Talk Now" → immediate phone helpline & callback option
    if (step.id === 'service' && answers['welcome'] === 'Talk Now') {
      showTyping();
      setTimeout(() => {
        hideTyping();
        addBotMessage('Our Clinical Care Supervisor on duty across Bengaluru is available 24/7.');
        setTimeout(() => showActionButtons(), 400);
      }, 600);
      return;
    }

    showTyping();
    setTimeout(() => {
      hideTyping();
      addBotMessage(step.message);

      setTimeout(() => {
        if (step.options) {
          showOptions(step.options, (value) => {
            answers[step.id] = value;
            currentStep++;
            setTimeout(() => processStep(), 300);
          });
        } else if (step.input) {
          showInput(step.input, (value) => {
            answers[step.id] = value;
            currentStep++;
            if (currentStep >= steps.length) {
              setTimeout(() => completeCallbackFlow(), 300);
            } else {
              setTimeout(() => processStep(), 300);
            }
          });
        }
      }, 200);
    }, 700);
  }

  function showSummary() {
    showTyping();
    setTimeout(() => {
      hideTyping();

      const summary = `Here are your care details:\n\n` +
        `🩺 Service: ${answers.service || '-'}\n` +
        `👤 Patient: ${answers.patient || '-'}\n` +
        `⏱️ Shift: ${answers.shift || '-'}\n` +
        `📍 Area: ${answers.area || '-'}\n` +
        `🙋 Name: ${answers.name || '-'}\n` +
        `📞 Phone: ${answers.phone || '-'}`;

      addBotMessage(summary);

      setTimeout(() => {
        addBotMessage('Would you like our Clinical Supervisor to call you to confirm your care schedule?');
        setTimeout(() => {
          showActionButtons();
          showRestartButton();
        }, 300);
      }, 500);
    }, 600);
  }

  function completeCallbackFlow() {
    showTyping();

    // Persist full lead details to database & sheets
    try {
      fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: answers.name || 'Chatbot User',
          phone: answers.phone || '',
          service: answers.service || 'General Nursing Care',
          duration: answers.shift || '',
          location: answers.area || 'Bengaluru',
          notes: `Patient: ${answers.patient || 'Not specified'} (Chat Assistant)`,
          source: 'chatbot'
        })
      }).catch(e => console.warn('Offline mode or server unavailable:', e));
    } catch (err) {
      console.warn('Error saving lead to DB:', err);
    }

    setTimeout(() => {
      hideTyping();
      const userName = answers.name ? answers.name : 'there';
      addBotMessage(`All details have been sent to our clinical team! 📋`);
      setTimeout(() => {
        addBotMessage(`Our team will call you soon to confirm your care requirements. If you want instant support or a quick quote, feel free to call us or WhatsApp us directly below:`);
        setTimeout(() => {
          showActionButtons();
          showRestartButton();
        }, 300);
      }, 500);
    }, 600);
  }

  function showActionButtons() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin-top: 10px; width: 100%;';

    const callBtn = document.createElement('a');
    callBtn.href = 'tel:+919931450495';
    callBtn.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: #0a2540; color: #fff; border-radius: 12px; font-size: 13.5px; font-weight: 700; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 12px rgba(10,37,64,0.15);';
    callBtn.innerHTML = `<span>📞 Call Us: +91 9931450495</span>`;

    const waMsg = buildWhatsAppMessage();
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;
    const waBtn = document.createElement('a');
    waBtn.href = url;
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
    waBtn.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: #25D366; color: #fff; border-radius: 12px; font-size: 13.5px; font-weight: 700; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,211,102,0.2);';
    waBtn.innerHTML = `<span>💬 WhatsApp Us: +91 9931450495</span>`;

    wrap.appendChild(callBtn);
    wrap.appendChild(waBtn);
    body().appendChild(wrap);
    scrollBottom();
  }

  function showRestartButton() {
    const btn = document.createElement('button');
    btn.className = 'ec-restart';
    btn.textContent = '↻ Start Over';
    btn.addEventListener('click', () => {
      currentStep = 0;
      answers = {};
      body().innerHTML = '';
      startChat();
    });
    body().appendChild(btn);
    scrollBottom();
  }

  function buildWhatsAppMessage() {
    if (answers['welcome'] === 'Talk Now') {
      return 'Hello EarthCone Home Nursing, I want to speak with someone about your nursing services.';
    }

    let msg = `*Hello EarthCone Home Nursing!*\n`;
    msg += `I'd like to book/inquire about a service.\n\n`;
    if (answers.service) msg += `🩺 *Service:* ${answers.service}\n`;
    if (answers.patient) msg += `👤 *Patient:* ${answers.patient}\n`;
    if (answers.shift) msg += `⏱️ *Shift:* ${answers.shift}\n`;
    if (answers.area) msg += `📍 *Area:* ${answers.area}\n`;
    if (answers.name) msg += `🙋 *Name:* ${answers.name}\n`;
    if (answers.phone) msg += `📞 *Phone:* ${answers.phone}\n`;
    msg += `\n_Sent via EarthCone Care Assistant_`;
    return msg;
  }

  function startChat() {
    processStep();
  }

  // ── Initialize ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
