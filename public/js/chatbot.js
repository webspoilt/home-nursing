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
        { label: '📍 BTM Layout', value: 'BTM Layout' },
        { label: '📍 JP Nagar', value: 'JP Nagar' },
        { label: '📍 HSR Layout', value: 'HSR Layout' },
        { label: '📍 Koramangala', value: 'Koramangala' },
        { label: '📍 Jayanagar', value: 'Jayanagar' },
        { label: '📍 Bannerghatta Road', value: 'Bannerghatta Road' },
        { label: '📍 Other Area', value: 'Other Area' }
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
        background: linear-gradient(135deg, #0d9488, #0284c7);
        color: #fff; border: none; cursor: pointer;
        box-shadow: 0 6px 24px rgba(13,148,136,0.45);
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s ease;
        animation: ec-pulse 2s infinite;
      }
      #ec-chatbot-toggle:hover { transform: scale(1.1); }
      #ec-chatbot-toggle svg { width: 28px; height: 28px; }
      #ec-chatbot-toggle.open { animation: none; background: #475569; }
      @keyframes ec-pulse {
        0%, 100% { box-shadow: 0 6px 24px rgba(13,148,136,0.45); }
        50% { box-shadow: 0 6px 36px rgba(13,148,136,0.7), 0 0 0 12px rgba(13,148,136,0.12); }
      }

      #ec-chatbot-panel {
        position: fixed; bottom: 100px; right: 24px; z-index: 9998;
        width: 370px; max-width: calc(100vw - 32px);
        max-height: 520px;
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
        font-size: 14px; outline: none;
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

      @media (max-width: 420px) {
        #ec-chatbot-panel { right: 8px; bottom: 90px; width: calc(100vw - 16px); }
        #ec-chatbot-toggle { bottom: 18px; right: 18px; width: 54px; height: 54px; }
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
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      toggle.classList.toggle('open', isOpen);
      toggle.innerHTML = isOpen
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      if (isOpen && currentStep === 0 && document.getElementById('ec-chat-body').children.length === 0) {
        startChat();
      }
    });
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

    // Special shortcut: "Talk Now" → immediate WhatsApp
    if (step.id === 'service' && answers['welcome'] === 'Talk Now') {
      showTyping();
      setTimeout(() => {
        hideTyping();
        addBotMessage('Sure! Let me connect you directly to our team on WhatsApp.');
        setTimeout(() => showWhatsAppButton(), 400);
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
              setTimeout(() => directToWhatsApp(), 300);
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

      const summary = `Here's what I've got:\n\n` +
        `🩺 Service: ${answers.service || '-'}\n` +
        `👤 Patient: ${answers.patient || '-'}\n` +
        `⏱️ Shift: ${answers.shift || '-'}\n` +
        `📍 Area: ${answers.area || '-'}\n` +
        `🙋 Name: ${answers.name || '-'}\n` +
        `📞 Phone: ${answers.phone || '-'}`;

      addBotMessage(summary);

      setTimeout(() => {
        addBotMessage('Tap below to send all these details to our care team on WhatsApp. They will respond within minutes! 💚');
        setTimeout(() => {
          showWhatsAppButton();
          showRestartButton();
        }, 300);
      }, 500);
    }, 600);
  }

  function directToWhatsApp() {
    showTyping();
    setTimeout(() => {
      hideTyping();
      addBotMessage('Thank you! 🙏 Connecting you to our care team on WhatsApp...');
      const waMsg = buildWhatsAppMessage();
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;
      setTimeout(() => {
        window.open(url, '_blank');
        setTimeout(() => {
          addBotMessage('WhatsApp opened! Our team will respond within minutes. 💚');
          showRestartButton();
        }, 500);
      }, 800);
    }, 600);
  }

  function showWhatsAppButton() {
    const waMsg = buildWhatsAppMessage();
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;

    const btn = document.createElement('button');
    btn.className = 'ec-wa-btn';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086.159.058 1.011.477 1.184.564.173.087.289.129.332.202.043.073.043.419-.101.824z"/><path d="M12 2C6.486 2 2 6.486 2 12c0 1.846.507 3.578 1.389 5.064L2.055 22l5.064-1.334A9.94 9.94 0 0 0 12 22c5.514 0 10-4.486 10-10S17.514 2 12 2zm0 18.2c-1.637 0-3.17-.468-4.477-1.28l-.321-.202-3.003.79.803-2.93-.221-.351A8.172 8.172 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.522 0 8.2 3.679 8.2 8.2 0 4.521-3.678 8.2-8.2 8.2z"/></svg>
      Chat on WhatsApp`;
    btn.addEventListener('click', () => window.open(url, '_blank'));
    body().appendChild(btn);
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
