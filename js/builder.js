/* ============================================================
   MARIGOLD SIP CO — DRINK BUILDER
   Manages selection state, live SVG cup preview, running total,
   and a simple localStorage-backed order queue.
   ============================================================ */

(function () {
  "use strict";

  const BASE_PRICE = 4.5;

  const state = {
    base: { value: "Espresso", price: 0, color: "#5A3D2B" },
    flavor: { value: "Brown Sugar", price: 0.5, color: "#C98A4B" },
    sweetness: 50,
    milk: { value: "Whole Milk", price: 0 },
    size: { value: "16 oz", price: 0, scale: 1 },
    toppings: [], // { value, price }
  };

  /* ---------- Element refs ---------- */
  const el = (id) => document.getElementById(id);
  const previewLiquid = el("previewLiquid");
  const previewFoam = el("previewFoam");
  const previewBoba = el("previewBoba");
  const previewCoconut = el("previewCoconut");
  const previewCinnamon = el("previewCinnamon");
  const previewWhip = el("previewWhip");
  const previewDrizzle = el("previewDrizzle");
  const cupSvg = el("cupScaleGroupSvg");

  if (!previewLiquid) return; // not on this page

  /* ---------- Selection wiring for single-select groups ---------- */
  function wireSingleSelect(containerId, onSelect) {
    const container = el(containerId);
    if (!container) return;
    container.querySelectorAll(".option-tile").forEach((tile) => {
      tile.addEventListener("click", () => {
        container.querySelectorAll(".option-tile").forEach((t) => t.classList.remove("is-selected"));
        tile.classList.add("is-selected");
        onSelect(tile);
        render();
      });
    });
  }

  wireSingleSelect("optBase", (tile) => {
    state.base = {
      value: tile.dataset.value,
      price: parseFloat(tile.dataset.price),
      color: tile.dataset.color,
    };
  });

  wireSingleSelect("optFlavor", (tile) => {
    state.flavor = {
      value: tile.dataset.value,
      price: parseFloat(tile.dataset.price),
      color: tile.dataset.color,
    };
  });

  wireSingleSelect("optMilk", (tile) => {
    state.milk = { value: tile.dataset.value, price: parseFloat(tile.dataset.price) };
  });

  wireSingleSelect("optSize", (tile) => {
    state.size = {
      value: tile.dataset.value,
      price: parseFloat(tile.dataset.price),
      scale: parseFloat(tile.dataset.scale),
    };
  });

  /* ---------- Toppings (multi-select) ---------- */
  const toppingsContainer = el("optToppings");
  if (toppingsContainer) {
    toppingsContainer.querySelectorAll(".option-tile").forEach((tile) => {
      tile.addEventListener("click", () => {
        const value = tile.dataset.value;
        const price = parseFloat(tile.dataset.price);
        const idx = state.toppings.findIndex((t) => t.value === value);
        if (idx > -1) {
          state.toppings.splice(idx, 1);
          tile.classList.remove("is-selected");
        } else {
          state.toppings.push({ value, price });
          tile.classList.add("is-selected");
        }
        render();
      });
    });
  }

  /* ---------- Sweetness slider ---------- */
  const sweetnessSlider = el("sweetnessSlider");
  if (sweetnessSlider) {
    sweetnessSlider.addEventListener("input", () => {
      state.sweetness = parseInt(sweetnessSlider.value, 10);
      render();
    });
  }

  /* ---------- Color blending for liquid preview ---------- */
  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }
  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
        .join("")
    );
  }
  function blend(hex1, hex2, weight) {
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);
    return rgbToHex(
      c1.r * (1 - weight) + c2.r * weight,
      c1.g * (1 - weight) + c2.g * weight,
      c1.b * (1 - weight) + c2.b * weight
    );
  }

  const sweetLabel = (val) => {
    if (val === 0) return "Unsweet";
    if (val === 25) return "Light (25%)";
    if (val === 50) return "Classic (50%)";
    if (val === 75) return "Sweet (75%)";
    return "Extra Sweet (100%)";
  };

  /* ---------- Render ---------- */
  function render() {
    // liquid color: blend base + flavor color, 60/40
    const liquidColor = blend(state.base.color, state.flavor.color, 0.45);
    if (previewLiquid) previewLiquid.setAttribute("fill", liquidColor);

    // toppings visibility
    const has = (name) => state.toppings.some((t) => t.value === name);
    if (previewFoam) previewFoam.setAttribute("opacity", has("Cold Foam") ? "0.95" : "0");
    if (previewBoba) previewBoba.setAttribute("opacity", has("Boba Pearls") ? "1" : "0");
    if (previewCoconut) previewCoconut.setAttribute("opacity", has("Toasted Coconut") ? "1" : "0");
    if (previewCinnamon) previewCinnamon.setAttribute("opacity", has("Cinnamon Dust") ? "1" : "0");
    if (previewWhip) previewWhip.setAttribute("opacity", has("Whipped Cream") ? "1" : "0");
    if (previewDrizzle) previewDrizzle.setAttribute("opacity", has("Caramel Drizzle") ? "1" : "0");

    // size scale
    if (cupSvg) cupSvg.style.transform = `scale(${state.size.scale})`;

    // summary chips
    setText("summaryBase", state.base.value);
    setText("summaryFlavor", state.flavor.value);
    setText("summarySweet", state.sweetness + "%");
    setText("summaryMilk", state.milk.value);
    setText("summarySize", state.size.value);
    setText("summaryToppingsCount", state.toppings.length + " selected");

    // preview summary rows
    setText("rowBase", state.base.value);
    setText("rowFlavor", state.flavor.value);
    setText("rowSweet", sweetLabel(state.sweetness));
    setText("rowMilk", state.milk.value);
    setText("rowSize", state.size.value);
    setText("rowToppings", state.toppings.length ? state.toppings.map((t) => t.value).join(", ") : "None yet");

    // price
    const total = calcTotal();
    setText("previewTotal", "$" + total.toFixed(2));

    // email link
    const emailBtn = el("emailOrderBtn");
    if (emailBtn) {
      emailBtn.href = buildMailto(total);
    }
  }

  function setText(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }

  function calcTotal() {
    const toppingsTotal = state.toppings.reduce((sum, t) => sum + t.price, 0);
    return BASE_PRICE + state.base.price + state.flavor.price + state.milk.price + state.size.price + toppingsTotal;
  }

  function summaryLine() {
    const toppings = state.toppings.length ? state.toppings.map((t) => t.value).join(", ") : "No toppings";
    return `${state.size.value} ${state.base.value} — ${state.flavor.value}, ${sweetLabel(state.sweetness)}, ${state.milk.value}, Toppings: ${toppings}`;
  }

  function buildMailto(total) {
    const subject = encodeURIComponent("Custom Drink Order — Marigold Sip Co.");
    const body = encodeURIComponent(
      `Hi Marigold Sip Co.,\n\nI'd like to order:\n\n${summaryLine()}\n\nEstimated total: $${total.toFixed(
        2
      )}\n\nThanks!`
    );
    return `mailto:hello@marigoldsipco.example?subject=${subject}&body=${body}`;
  }

  /* ---------- Order queue (localStorage) ---------- */
  const ORDER_KEY = "marigold_order_queue";

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveOrders(orders) {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
    } catch (e) {
      /* storage unavailable — silently ignore */
    }
  }

  function renderOrderSummary() {
    const orders = getOrders();
    const section = el("orderSummarySection");
    const list = el("orderList");
    const grandTotalEl = el("orderGrandTotal");
    if (!section || !list) return;

    if (!orders.length) {
      section.style.display = "none";
      return;
    }
    section.style.display = "";
    list.innerHTML = "";
    let grandTotal = 0;

    orders.forEach((order, index) => {
      grandTotal += order.total;
      const row = document.createElement("div");
      row.style.cssText =
        "background:var(--white);border-radius:var(--r-md);padding:1rem 1.3rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;box-shadow:var(--shadow-soft);";
      row.innerHTML = `
        <div>
          <strong style="font-family:var(--font-display);">${order.size} ${order.base}</strong>
          <div style="font-size:0.85rem;color:var(--brown);margin-top:0.2rem;">${order.flavor} · ${order.sweetness} · ${order.milk}${
        order.toppings.length ? " · " + order.toppings.join(", ") : ""
      }</div>
        </div>
        <div style="display:flex;align-items:center;gap:1rem;flex-shrink:0;">
          <strong style="color:var(--peach-deep);">$${order.total.toFixed(2)}</strong>
          <button type="button" class="btn btn-ghost btn-sm" data-remove-index="${index}">Remove</button>
        </div>`;
      list.appendChild(row);
    });

    if (grandTotalEl) grandTotalEl.textContent = "$" + grandTotal.toFixed(2);

    list.querySelectorAll("[data-remove-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const orders2 = getOrders();
        orders2.splice(parseInt(btn.dataset.removeIndex, 10), 1);
        saveOrders(orders2);
        renderOrderSummary();
      });
    });
  }

  const addToOrderBtn = el("addToOrderBtn");
  if (addToOrderBtn) {
    addToOrderBtn.addEventListener("click", () => {
      const orders = getOrders();
      orders.push({
        base: state.base.value,
        flavor: state.flavor.value,
        sweetness: sweetLabel(state.sweetness),
        milk: state.milk.value,
        size: state.size.value,
        toppings: state.toppings.map((t) => t.value),
        total: calcTotal(),
      });
      saveOrders(orders);
      renderOrderSummary();
      if (window.MarigoldToast) window.MarigoldToast("Added to your order! 🧋");
      const section = el("orderSummarySection");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const clearOrderBtn = el("clearOrderBtn");
  if (clearOrderBtn) {
    clearOrderBtn.addEventListener("click", () => {
      saveOrders([]);
      renderOrderSummary();
      if (window.MarigoldToast) window.MarigoldToast("Order cleared.");
    });
  }

  /* ---------- init ---------- */
  render();
  renderOrderSummary();
})();
