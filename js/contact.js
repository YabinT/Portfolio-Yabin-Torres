/* Message match — the contact page answers the button that got you here.
   Class 07 rule: a mismatched CTA/H1 is the highest-friction pattern there is,
   so ?intent= rewrites the headline, lede, placeholder and submit label.
   Unknown or absent values fall through to the copy already in the HTML. */

(function () {
  const INTENTS = {
    audit: {
      label:  'Diagnosis & audit',
      title:  'Let’s find out what is actually broken',
      lede:   'Tell me which platform to look at and what makes you think something is off. I come back with what the audit would cover and what it costs — before you commit to anything.',
      hint:   'Which platform should I look at, and what makes you think something is off?',
      submit: 'Request the audit',
    },
    redesign: {
      label:  'Redesign & interface',
      title:  'Let’s rebuild it, not repaint it',
      lede:   'Tell me what people are supposed to do on the platform, and where they stop doing it. I read every message and usually reply within a day.',
      hint:   'What should people be doing on it, and where do they drop off?',
      submit: 'Start a redesign',
    },
    systems: {
      label:  'Design systems',
      title:  'Let’s talk about the system',
      lede:   'Tell me how many screens or campaigns you are maintaining, and who has to build the next one. I read every message and usually reply within a day.',
      hint:   'How many screens or campaigns, and who builds the next one?',
      submit: 'Talk about a system',
    },
    brand: {
      label:  'Brand identity',
      title:  'Let’s build the brand',
      lede:   'Tell me what the organisation does and what deadline you are up against. I read every message and usually reply within a day.',
      hint:   'What does the organisation do, and what is the deadline?',
      submit: 'Start a brand',
    },
    broken: {
      label:  'Not sure which one',
      title:  'Tell me what is broken',
      lede:   'You do not need to know which service you need — working that out is the first part of the job. Describe what is not working and I will tell you where I would start.',
      hint:   'What is not working?',
      submit: 'Send it over',
    },
    teardown: {
      label:  'Free page teardown',
      title:  'Send me a page',
      lede:   'Paste the URL and tell me what that page is supposed to achieve. You get a written teardown back — no charge, no pitch deck, no mailing list.',
      hint:   'Paste the URL, and tell me what that page is supposed to achieve.',
      submit: 'Send the page',
    },
  };

  let key;
  try {
    key = new URLSearchParams(window.location.search).get('intent');
  } catch (error) {
    return; /* Very old browser: the page keeps its default copy. */
  }

  const intentField = document.getElementById('form-intent');
  if (intentField && key) intentField.value = key;

  const intent = INTENTS[key];
  if (!intent) return;

  const set = function (id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  set('contact-label', intent.label);
  set('contact-title', intent.title);
  set('contact-lede',  intent.lede);
  set('contact-submit', intent.submit);

  const message = document.getElementById('message');
  if (message) message.placeholder = intent.hint;

  /* So the notification email says which door they came through. */
  const subject = document.getElementById('form-subject');
  if (subject) subject.value = 'yabintorres.com — ' + intent.label;
})();

/* Contact form — async submit to Web3Forms.
   The form posts natively if this script never runs, so a failed
   load degrades to a normal page-navigation submit. */

(function () {
  const form   = document.getElementById('contact-form');
  const button = document.getElementById('contact-submit');
  const status = document.getElementById('form-status');

  if (!form || !button || !status) return;

  const DEFAULT_LABEL = button.textContent;

  function setStatus(message, state) {
    status.textContent = message;
    status.classList.remove('is-ok', 'is-error');
    if (state) status.classList.add(state);
  }

  /* The captcha token is single-use: without a reset, a second attempt
     in the same page view is always rejected. */
  function resetCaptcha() {
    try {
      if (window.hcaptcha && typeof window.hcaptcha.reset === 'function') {
        window.hcaptcha.reset();
      }
    } catch (error) {
      /* A missing or not-yet-loaded widget is not worth surfacing. */
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const payload = Object.fromEntries(new FormData(form).entries());

    if (!payload['h-captcha-response']) {
      setStatus('Please complete the captcha before sending.', 'is-error');
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';
    setStatus('');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        form.reset();
        setStatus('Thanks — your message is on its way. I usually reply within a day.', 'is-ok');
      } else {
        /* Web3Forms explains the rejection (bad captcha, spam flag);
           that is more useful than a blanket failure message. */
        setStatus(
          (result && result.message) ||
          'Your message was not accepted. Please try again.',
          'is-error'
        );
      }
    } catch (error) {
      setStatus(
        'Could not reach the server. Check your connection, or reach me on LinkedIn.',
        'is-error'
      );
    } finally {
      resetCaptcha();
      button.disabled = false;
      button.textContent = DEFAULT_LABEL;
    }
  });
})();
