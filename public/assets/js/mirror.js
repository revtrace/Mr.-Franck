// Replaces the few pieces of Squarespace JavaScript the site actually needs.

// Where form submissions go. FormSubmit emails each submission to the address in the endpoint
// and copies the FORM_CC addresses (comma-separated). The first submission sends a one-time
// activation email to the endpoint address; click the link in it before forms are delivered.
// Replies go straight to the visitor (their email is sent as _replyto).
var FORM_ENDPOINT = "https://formsubmit.co/ajax/kris@hutch.agency";
var FORM_CC = "mrfranckdriver@gmail.com";

(function () {
  // Mobile menu (burger) open/close, same classes Squarespace toggles.
  document.querySelectorAll(".header-burger-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = document.body.classList.toggle("header--menu-open");
      document.querySelectorAll(".header-burger-btn").forEach(function (b) {
        b.classList.toggle("burger--active", open);
        b.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.querySelectorAll(".header-menu").forEach(function (m) {
        m.setAttribute("aria-hidden", open ? "false" : "true");
      });
    });
  });

  // The header sits on top of the page; push the first section down by its height,
  // as Squarespace's own script does.
  function fitHeader() {
    var h = document.getElementById("header");
    var first = document.querySelector("#page .page-section");
    if (!h || !first) return;
    var px = h.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-height", px + "px");
    first.style.paddingTop = px + "px";
  }
  fitHeader();
  window.addEventListener("resize", fitHeader);
  window.addEventListener("load", fitHeader);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeader);
  document.querySelectorAll("#header img").forEach(function (i) { i.addEventListener("load", fitHeader); });

  // Squarespace adds this class once its scripts load; some styles depend on it.
  document.documentElement.classList.remove("wf-loading");

  // Forms: submit by fetch, then show the original "Thank you" message in place.
  document.querySelectorAll("[data-mf-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = form.querySelector(".mf-error");
      err.hidden = true;
      if (!form.checkValidity()) {
        err.textContent = "Please fill in your name and a valid email address.";
        err.hidden = false;
        form.reportValidity();
        return;
      }
      var btn = form.querySelector(".mf-submit");
      btn.disabled = true;
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      var email = form.querySelector('input[type="email"]');
      if (email) data._replyto = email.value;
      if (FORM_CC) data._cc = FORM_CC;
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function () {
          form.hidden = true;
          form.nextElementSibling.hidden = false;
        })
        .catch(function () {
          err.textContent = "Sorry, your message could not be sent. Please email mrfranckdriver@gmail.com or call +33 6 14 70 30 77.";
          err.hidden = false;
          btn.disabled = false;
        });
    });
  });
})();
