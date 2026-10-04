/* Cookie consent — Google Analytics loads only after a visitor accepts.
   Under the GDPR and Spain's LSSI (art. 22.2) analytics cookies need prior,
   opt-in consent, so nothing from Google is requested until "Accept".
   The choice itself lives in localStorage: it's strictly necessary to
   remember it, and it never leaves the browser.
   Any element with [data-cookie-settings] reopens the banner. */
(function () {
  var GA_ID = 'G-5MHWQYG4MV';
  var KEY = 'yt-cookie-consent';

  function readChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function saveChoice(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode: ask again next visit */ }
  }

  function loadAnalytics() {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // GA sets its cookies on the registrable domain, so clear both scopes.
  function clearAnalyticsCookies() {
    var names = ['_ga', '_ga_' + GA_ID.replace('G-', '')];
    var host = location.hostname;
    var domains = ['', host, '.' + host.replace(/^www\./, '')];
    names.forEach(function (name) {
      domains.forEach(function (domain) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' +
          (domain ? '; domain=' + domain : '');
      });
    });
  }

  var banner;

  function buildBanner() {
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.innerHTML =
      '<p class="cookie-banner-text">I use Google Analytics to see which pages people read. ' +
      'It only runs if you accept. <a href="/privacy.html">Privacy policy</a></p>' +
      '<div class="cookie-banner-actions">' +
        '<button type="button" class="cookie-btn" data-consent="denied">Decline</button>' +
        '<button type="button" class="cookie-btn" data-consent="granted">Accept</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      decide(btn.getAttribute('data-consent'));
    });
    document.body.appendChild(banner);
  }

  function showBanner() {
    if (!banner) buildBanner();
    banner.hidden = false;
  }

  function decide(value) {
    var previous = readChoice();
    saveChoice(value);
    banner.hidden = true;
    if (value === 'granted') {
      loadAnalytics();
    } else if (previous === 'granted') {
      // gtag.js is already running in this page; a reload is the only way to stop it.
      clearAnalyticsCookies();
      location.reload();
    }
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-cookie-settings]');
    if (!trigger) return;
    e.preventDefault();
    showBanner();
  });

  var choice = readChoice();
  if (choice === 'granted') {
    loadAnalytics();
  } else if (choice !== 'denied') {
    if (document.body) showBanner();
    else document.addEventListener('DOMContentLoaded', showBanner);
  }
})();
