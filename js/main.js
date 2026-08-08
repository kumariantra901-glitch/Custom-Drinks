/* ============================================================
   MARIGOLD SIP CO — MAIN SITE SCRIPT
   Handles: sticky header, mobile nav, scroll reveals, marquee
   duplication safety, drink filters, FAQ accordion, newsletter
   and contact form validation, and toast notifications.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Toast ---------- */
  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }
  window.MarigoldToast = showToast;

  /* ---------- Sticky header shadow ---------- */
  const header = document.getElementById("siteHeader");
  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 12) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Drink filter chips (signature-drinks.html) ---------- */
  const filterBar = document.getElementById("filterBar");
  const menuGrid = document.getElementById("menuGrid");
  const emptyState = document.getElementById("emptyState");
  if (filterBar && menuGrid) {
    const chips = filterBar.querySelectorAll(".filter-chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        const filter = chip.getAttribute("data-filter");
        let visibleCount = 0;
        menuGrid.querySelectorAll(".drink-card").forEach((card) => {
          const match = filter === "all" || card.getAttribute("data-cat") === filter;
          card.style.display = match ? "" : "none";
          if (match) visibleCount++;
        });
        if (emptyState) emptyState.style.display = visibleCount === 0 ? "block" : "none";
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const btn = item.querySelector(".faq-q");
    const answer = item.querySelector(".faq-a");
    if (!btn || !answer) return;
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove("is-open");
          openItem.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          openItem.querySelector(".faq-a").style.maxHeight = null;
        }
      });
      item.classList.toggle("is-open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + "px" : null;
    });
  });

  /* ---------- Email validation helper ---------- */
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  /* ---------- Newsletter forms (works on any page that has one) ---------- */
  function wireNewsletterForm(formId, successId) {
    const form = document.getElementById(formId);
    const success = document.getElementById(successId);
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !isValidEmail(input.value)) {
        input && input.focus();
        showToast("Please enter a valid email address.");
        return;
      }
      if (success) success.classList.add("is-visible");
      form.querySelector('input[type="email"]').value = "";
      showToast("You're subscribed! Welcome to the list. 🎉");
    });
  }
  wireNewsletterForm("newsletterForm", "newsletterSuccess");
  wireNewsletterForm("newsletterFormContact", "newsletterSuccessContact");

  /* ---------- Contact form ---------- */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    const fields = [
      { id: "cName", rowId: "fieldName", validate: (v) => v.trim().length >= 2, msg: "Please enter your name." },
      { id: "cEmail", rowId: "fieldEmail", validate: isValidEmail, msg: "Please enter a valid email." },
      { id: "cSubject", rowId: "fieldSubject", validate: (v) => v.trim().length > 0, msg: "Please choose a topic." },
      { id: "cMessage", rowId: "fieldMessage", validate: (v) => v.trim().length >= 10, msg: "Message should be at least 10 characters." },
    ];

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      fields.forEach((f) => {
        const input = document.getElementById(f.id);
        const row = document.getElementById(f.rowId);
        const errorEl = row ? row.querySelector(".form-error") : null;
        const ok = f.validate(input ? input.value : "");
        if (!ok) {
          valid = false;
          row && row.classList.add("has-error");
          if (errorEl) errorEl.textContent = f.msg;
        } else {
          row && row.classList.remove("has-error");
          if (errorEl) errorEl.textContent = "";
        }
      });

      if (!valid) {
        showToast("Please fix the highlighted fields.");
        return;
      }

      const successEl = document.getElementById("contactSuccess");
      if (successEl) successEl.classList.add("is-visible");
      showToast("Message sent — we'll be in touch soon!");
      contactForm.reset();
    });
  }

})();
