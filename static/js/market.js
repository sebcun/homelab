let rewards = [];
const marketGrid = document.getElementById("marketGrid");

let selectedReward = null;
const orderModalEl = document.getElementById("orderModal");
const orderModal = orderModalEl ? new bootstrap.Modal(orderModalEl) : null;
const orderItemImage = document.getElementById("orderItemImage");
const orderItemName = document.getElementById("orderItemName");
const orderItemDesc = document.getElementById("orderItemDesc");
const orderItemCostBadge = document.getElementById("orderItemCostBadge");
const orderQuantity = document.getElementById("orderQuantity");
const qtyMinus = document.getElementById("qtyMinus");
const qtyPlus = document.getElementById("qtyPlus");
const orderName = document.getElementById("orderName");
const orderEmail = document.getElementById("orderEmail");
const orderPhone = document.getElementById("orderPhone");
const orderAddress = document.getElementById("orderAddress");
const orderSuburb = document.getElementById("orderSuburb");
const orderPostcode = document.getElementById("orderPostcode");
const orderState = document.getElementById("orderState");
const orderCountry = document.getElementById("orderCountry");
const orderError = document.getElementById("orderError");
const orderTotal = document.getElementById("orderTotal");
const orderSubmitBtn = document.getElementById("orderSubmitBtn");

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

async function loadRewards() {
  try {
    const res = await fetch("/api/rewards");
    const data = await res.json();
    rewards = data.rewards || [];
    renderRewards();
  } catch (err) {
    console.error("Failed to load rewards:", err);
    marketGrid.innerHTML = '<div class="col-12 text-center text-danger">Failed to load rewards</div>';
  }
}

function renderRewards() {
  marketGrid.innerHTML = "";
  if (!rewards || rewards.length === 0) {
    marketGrid.innerHTML = '<div class="col-12 text-center text-muted py-4">No rewards yet.</div>';
    return;
  }
  rewards.forEach((reward) => {
    const el = document.createElement("div");
    el.className = "col fade-in";
    el.innerHTML = `
      <div class="card h-100 shadow border-0 rounded-3 admin-card">
        <div class="p-2">
          <img
            src="${escapeHtml(reward.image_url)}"
            class="card-img-top rounded-top-3 bg-light"
            alt="${escapeHtml(reward.name)}"
            style="height: 200px; object-fit: contain"
          />
        </div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0 text-truncate">${escapeHtml(reward.name)}</h5>
            <span class="badge bg-primary">${reward.cost} hour${reward.cost !== 1 ? 's' : ''}</span>
          </div>
          <p class="card-text text-muted small">${escapeHtml(reward.description)}</p>
          <div class="mt-auto pt-3 text-end">
            <button class="btn btn-primary order-btn" onclick="orderReward(${reward.id})">
              <i class="bi bi-cart-plus me-1"></i>ORDER
            </button>
          </div>
        </div>
      </div>
    `;
    marketGrid.appendChild(el);
  });
}

function orderReward(rewardId) {
  const reward = rewards.find((r) => r.id === rewardId);
  if (!reward) return;
  selectedReward = reward;
  if (orderItemImage) orderItemImage.src = reward.image_url || "";
  if (orderItemName) orderItemName.textContent = reward.name || "";
  if (orderItemDesc) orderItemDesc.textContent = reward.description || "";
  if (orderItemCostBadge) orderItemCostBadge.textContent = `${reward.cost} hour${reward.cost !== 1 ? 's' : ''}`;
  if (orderQuantity) { orderQuantity.value = 1; orderQuantity.min = 1; orderQuantity.max = 100; }
  if (orderName) orderName.value = "";
  if (orderEmail) orderEmail.value = "";
  if (orderPhone) orderPhone.value = "";
  if (orderAddress) orderAddress.value = "";
  if (orderSuburb) orderSuburb.value = "";
  if (orderPostcode) orderPostcode.value = "";
  if (orderState) orderState.value = "";
  if (orderCountry) orderCountry.value = "";
  if (orderError) orderError.textContent = "";
  updateOrderTotal();
  updateSubmitState();
  if (orderModal) orderModal.show();
}

function clampQuantity(val) {
  let n = parseInt(val || "1", 10);
  if (isNaN(n) || n < 1) n = 1;
  if (n > 100) n = 100;
  return n;
}

function updateOrderTotal() {
  if (!selectedReward) return;
  const qty = clampQuantity(orderQuantity ? orderQuantity.value : "1");
  if (orderTotal) orderTotal.textContent = (selectedReward.cost * qty).toString();
  updateSubmitState();
}

function formFilled() {
  if (!selectedReward) return false;
  const qty = clampQuantity(orderQuantity ? orderQuantity.value : "1");
  if (!qty || qty < 1 || qty > 100) return false;
  if (!orderName || !(orderName.value || "").trim()) return false;
  if (!orderEmail || !(orderEmail.value || "").trim()) return false;
  if (!orderPhone || !(orderPhone.value || "").trim()) return false;
  if (!orderAddress || !(orderAddress.value || "").trim()) return false;
  if (!orderSuburb || !(orderSuburb.value || "").trim()) return false;
  if (!orderPostcode || !(orderPostcode.value || "").trim()) return false;
  if (!orderState || !(orderState.value || "").trim()) return false;
  if (!orderCountry || !(orderCountry.value || "").trim()) return false;
  return true;
}

function updateSubmitState() {
  if (!orderSubmitBtn) return;
  orderSubmitBtn.disabled = !formFilled();
}

async function submitOrder() {
  if (!selectedReward) return;
  if (!formFilled()) { if (orderError) orderError.textContent = "Please fill all required fields."; return; }
  const qty = clampQuantity(orderQuantity ? orderQuantity.value : "1");
  const name = orderName ? (orderName.value || "").trim() : "";
  const email = orderEmail ? (orderEmail.value || "").trim() : "";
  const phone = orderPhone ? (orderPhone.value || "").trim() : "";
  const address = orderAddress ? (orderAddress.value || "").trim() : "";
  const suburb = orderSuburb ? (orderSuburb.value || "").trim() : "";
  const postcode = orderPostcode ? (orderPostcode.value || "").trim() : "";
  const state = orderState ? (orderState.value || "").trim() : "";
  const country = orderCountry ? (orderCountry.value || "").trim() : "";
  if (orderError) orderError.textContent = "";
  if (orderSubmitBtn) {
    orderSubmitBtn.disabled = true;
    const orig = orderSubmitBtn.innerHTML;
    orderSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Placing...';
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reward_id: selectedReward.id,
          quantity: qty,
          name,
          email,
          phone,
          address: { address, suburb, postcode, state, country }
        })
      });
      if (res.ok) {
        if (orderModal) orderModal.hide();
        alert("Order placed successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        if (orderError) orderError.textContent = err.error || `Failed to place order (${res.status})`;
      }
    } catch (err) {
      if (orderError) orderError.textContent = "Failed to place order.";
    } finally {
      orderSubmitBtn.disabled = false;
      orderSubmitBtn.innerHTML = orig;
      updateSubmitState();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadRewards();
  if (qtyMinus) qtyMinus.addEventListener("click", () => {
    const q = clampQuantity((parseInt((orderQuantity ? orderQuantity.value : "1"), 10) - 1).toString());
    if (orderQuantity) { orderQuantity.value = q; updateOrderTotal(); }
  });
  if (qtyPlus) qtyPlus.addEventListener("click", () => {
    const q = clampQuantity((parseInt((orderQuantity ? orderQuantity.value : "1"), 10) + 1).toString());
    if (orderQuantity) { orderQuantity.value = q; updateOrderTotal(); }
  });
  if (orderQuantity) orderQuantity.addEventListener("input", () => {
    orderQuantity.value = clampQuantity(orderQuantity.value);
    updateOrderTotal();
  });
  const fields = [orderName, orderEmail, orderPhone, orderAddress, orderSuburb, orderPostcode, orderState, orderCountry];
  fields.forEach((f) => { if (f) f.addEventListener("input", updateSubmitState); });
  if (orderSubmitBtn) orderSubmitBtn.addEventListener("click", submitOrder);
  updateSubmitState();
});