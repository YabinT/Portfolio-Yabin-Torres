document.addEventListener('DOMContentLoaded', function () {

  /* -- Scroll reveal ---------------------------------------- */
  var revealItems = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealItems.forEach(function (item) { observer.observe(item); });
  }

  /* -- Lightbox --------------------------------------------- */
  var overlay  = document.getElementById('lightbox');
  var lbImg    = document.getElementById('lightbox-img');
  var closeBtn = document.getElementById('lightbox-close');

  function openLightbox(src, alt, isWide) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    overlay.classList.toggle('lightbox-wide', !!isWide);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('open');
    overlay.classList.remove('lightbox-wide');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.js-lightbox').forEach(function (el) {
    el.addEventListener('click', function () {
      var img = el.querySelector('img');
      if (img) openLightbox(img.src, img.alt, el.classList.contains('js-lightbox-wide'));
    });
  });

  closeBtn.addEventListener('click', closeLightbox);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

});
