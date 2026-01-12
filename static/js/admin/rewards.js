let rewards = [];

const rewardList = document.getElementById("rewardList");
const saveRewardBtn = document.getElementById("saveRewardBtn");
const addRewardModalEl = document.getElementById("addRewardModal");
const addRewardModal = new bootstrap.Modal(addRewardModalEl);

function sanitizeUrl(url) {
  url = (url || "").trim();
  if (!/^(https?:\/\/|mailto:)/i.test(url)) return null;
  try {
    return encodeURI(url).replace(/"/g, "&quot;");
  } catch (e) {
    return null;
  }
}

function renderSimpleMarkdown(text) {
  if (!text) return "";
  let out = "";
  let lastIndex = 0;
  const regex =
    /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|~(.+?)~/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    out += escapeHtml(text.slice(lastIndex, match.index)).replace(
      /\n/g,
      "<br>"
    );
    if (match[1] && match[2]) {
      const label = match[1];
      const url = match[2];
      const safeUrl = sanitizeUrl(url);
      if (safeUrl) {
        out += `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          label
        )}</a>`;
      } else {
        out += escapeHtml(match[0]);
      }
    } else if (match[3]) {
      out += `<strong>${escapeHtml(match[3])}</strong>`;
    } else if (match[4]) {
      out += `<em>${escapeHtml(match[4])}</em>`;
    } else if (match[5]) {
      out += `<u>${escapeHtml(match[5])}</u>`;
    } else if (match[6]) {
      out += `<del>${escapeHtml(match[6])}</del>`;
    }
    lastIndex = match.index + match[0].length;
  }
  out += escapeHtml(text.slice(lastIndex)).replace(/\n/g, "<br>");
  return out;
}

async function loadRewards() {
  try {
    const response = await fetch("/api/rewards");
    const data = await response.json();
    rewards = data.rewards || [];
    renderRewards();
  } catch (error) {
    console.error("Failed to load rewards:", error);
    rewardList.innerHTML =
      '<div class="col-12 text-center text-danger">Failed to load rewards</div>';
  }
}

function renderRewards() {
  rewardList.innerHTML = "";

  if (rewards.length === 0) {
    rewardList.innerHTML =
      '<div class="col-12 text-center text-muted py-4">No rewards yet. Add your first reward!</div>';
    return;
  }

  rewards.forEach((reward) => {
    const rewardEl = document.createElement("div");
    rewardEl.className = "col fade-in";
    rewardEl.innerHTML = `
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
            <h5 class="card-title mb-0 text-truncate">${escapeHtml(
              reward.name
            )}</h5>
            <span class="badge bg-primary">${reward.cost} hour${
      reward.cost !== 1 ? "s" : ""
    }</span>
          </div>
          <p class="card-text text-muted small">${escapeHtml(
            reward.description
          )}</p>
          <div class="mt-auto pt-3 text-end">
            <button class="btn btn-outline-danger btn-sm delete-btn" onclick="deleteReward(${
              reward.id
            })">
              <i class="bi bi-trash me-1"></i>Remove
            </button>
          </div>
        </div>
      </div>
    `;
    rewardList.appendChild(rewardEl);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function createReward() {
  const name = document.getElementById("rewardName").value.trim();
  const cost = parseFloat(document.getElementById("rewardCost").value);
  const imageUrl = document.getElementById("rewardImage").value.trim();
  const description = document.getElementById("rewardDesc").value.trim();

  if (!name || !cost || !imageUrl || !description) {
    alert("Please fill in all fields");
    return;
  }

  if (isNaN(cost) || cost <= 0) {
    alert("Cost must be a positive number");
    return;
  }

  saveRewardBtn.disabled = true;
  saveRewardBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';

  try {
    const response = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cost, image_url: imageUrl, description }),
    });

    if (response.ok) {
      document.getElementById("addRewardForm").reset();
      addRewardModal.hide();
      await loadRewards();
    } else {
      const error = await response.json();
      alert(error.error || "Failed to add reward");
    }
  } catch (error) {
    console.error("Failed to create reward:", error);
    alert("Failed to add reward");
  } finally {
    saveRewardBtn.disabled = false;
    saveRewardBtn.textContent = "Add Reward";
  }
}

async function deleteReward(rewardId) {
  if (!confirm("Are you sure you want to delete this reward?")) return;

  try {
    const response = await fetch(`/api/admin/rewards/${rewardId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await loadRewards();
    } else {
      const error = await response.json();
      alert(error.error || "Failed to delete reward");
    }
  } catch (error) {
    console.error("Failed to delete reward:", error);
    alert("Failed to delete reward");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadRewards();

  saveRewardBtn.addEventListener("click", createReward);
});
