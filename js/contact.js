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

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    button.disabled = true;
    button.textContent = 'Sending…';
    setStatus('');

    const payload = Object.fromEntries(new FormData(form).entries());

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
        throw new Error(result.message || 'Submission rejected');
      }
    } catch (error) {
      setStatus(
        'Something went wrong. Write me directly at yabintc@gmail.com.',
        'is-error'
      );
    } finally {
      button.disabled = false;
      button.textContent = DEFAULT_LABEL;
    }
  });
})();
