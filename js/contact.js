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
