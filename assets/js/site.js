/* =====================================================================
   Mr. Franck — site behaviour
   Vanilla JS, no dependencies. Everything degrades gracefully.
   ===================================================================== */
(function () {
  'use strict';

  /* --- Mobile navigation ------------------------------------------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('site-nav');
  var headerEl = document.querySelector('.header');

  if (burger && nav) {
    var setNav = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (headerEl) headerEl.classList.toggle('is-nav-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    burger.addEventListener('click', function () {
      setNav(burger.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        burger.focus();
      }
    });
  }

  /* --- Header state on scroll (transparent hero header only) -------- */
  var header = document.querySelector('.header--over');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- FAQ accordion ------------------------------------------------ */
  document.querySelectorAll('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
    });
  });

  /* --- Reveal on scroll ---------------------------------------------
     Deliberately NOT IntersectionObserver. IO delivers records
     asynchronously, so a fast flick-scroll (or a programmatic jump) can
     skip elements and leave real content stuck at opacity 0. This runs on
     every scroll and resize, so an element can never stay hidden once it
     has been anywhere near the viewport.
     ------------------------------------------------------------------ */
  var pending = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (pending.length) {
    var ticking = false;

    var sweep = function () {
      ticking = false;
      var limit = window.innerHeight * 0.94;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add('is-in');
          return false;
        }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', request);
        window.removeEventListener('resize', request);
      }
    };

    var request = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sweep);
    };

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    window.addEventListener('load', request);
    sweep();
  }

  /* --- Booking form: sensible date floor + honeypot ------------------ */
  var dateInput = document.querySelector('input[type="date"]');
  if (dateInput && !dateInput.min) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  /* --- Booking form: WhatsApp fallback submit ------------------------
     If no form endpoint is configured yet (see CONTENT-TODO.md), the
     form composes a pre-filled WhatsApp message instead of failing.
     ------------------------------------------------------------------ */
  var form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      var endpoint = form.getAttribute('action') || '';
      var configured = endpoint && endpoint.indexOf('REPLACE_WITH') === -1;
      if (configured) return; // let it post normally

      e.preventDefault();

      if (form.querySelector('.hp input') && form.querySelector('.hp input').value) return;

      var get = function (name) {
        var el = form.elements[name];
        return el && el.value ? el.value.trim() : '';
      };

      var lines = [
        'Hello Franck, I would like to book a ride.',
        '',
        'Service: ' + (get('service') || '—'),
        'Pick-up: ' + (get('pickup') || '—'),
        'Drop-off: ' + (get('dropoff') || '—'),
        'Date: ' + (get('date') || '—') + '  Time: ' + (get('time') || '—'),
        'Passengers: ' + (get('passengers') || '—') + '  Bags: ' + (get('luggage') || '—'),
        'Flight / train no.: ' + (get('flight') || '—'),
        '',
        'Name: ' + (get('name') || '—'),
        'Email: ' + (get('email') || '—'),
        'Phone: ' + (get('phone') || '—'),
        '',
        (get('notes') || '')
      ];

      var url = 'https://wa.me/33614703077?text=' +
        encodeURIComponent(lines.join('\n').trim());
      window.open(url, '_blank', 'noopener');
    });
  }

  /* --- Prefill the booking form from a route link -------------------- */
  var params = new URLSearchParams(window.location.search);
  ['service', 'pickup', 'dropoff'].forEach(function (key) {
    var value = params.get(key);
    if (!value || !form) return;
    var el = form.elements[key];
    if (!el) return;
    if (el.tagName === 'SELECT') {
      Array.prototype.forEach.call(el.options, function (opt) {
        if (opt.value.toLowerCase() === value.toLowerCase()) el.value = opt.value;
      });
    } else {
      el.value = value;
    }
  });

  /* --- Current year in footer ---------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
