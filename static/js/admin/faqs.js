let faqs = [];

const faqList = document.getElementById("faqList");
const saveFaqBtn = document.getElementById("saveFaqBtn");
const addFaqModalEl = document.getElementById("addFaqModal");
const addFaqModal = new bootstrap.Modal(addFaqModalEl);

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

async function loadFaqs() {
  try {
    const response = await fetch("/api/faqs");
    const data = await response.json();
    faqs = data.faqs || [];
    renderFaqs();
  } catch (error) {
    console.error("Failed to load FAQs:", error);
    faqList.innerHTML =
      '<div class="col-12 text-center text-danger">Failed to load FAQs</div>';
  }
}

function renderFaqs() {
  faqList.innerHTML = "";

  if (faqs.length === 0) {
    faqList.innerHTML =
      '<div class="col-12 text-center text-muted py-4">No FAQs yet. Add your first FAQ!</div>';
    return;
  }

  faqs.forEach((faq) => {
    const faqEl = document.createElement("div");
    faqEl.className = "col fade-in";
    faqEl.innerHTML = `
      <div class="card shadow-sm border-0 rounded-3 admin-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="card-title fw-bold mb-2">${escapeHtml(
                faq.question
              )}</h5>
              <p class="card-text text-muted">${renderSimpleMarkdown(
                faq.answer
              )}</p>
            </div>
            <button class="btn btn-outline-danger btn-sm delete-btn ms-3" onclick="deleteFaq(${
              faq.id
            })">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    faqList.appendChild(faqEl);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function createFaq() {
  const question = document.getElementById("faqQuestion").value.trim();
  const answer = document.getElementById("faqAnswer").value.trim();

  if (!question || !answer) {
    alert("Please fill in both question and answer");
    return;
  }

  saveFaqBtn.disabled = true;
  saveFaqBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';

  try {
    const response = await fetch("/api/admin/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });

    if (response.ok) {
      document.getElementById("addFaqForm").reset();
      addFaqModal.hide();
      await loadFaqs();
    } else {
      const error = await response.json();
      alert(error.error || "Failed to add FAQ");
    }
  } catch (error) {
    console.error("Failed to create FAQ:", error);
    alert("Failed to add FAQ");
  } finally {
    saveFaqBtn.disabled = false;
    saveFaqBtn.textContent = "Add FAQ";
  }
}

async function deleteFaq(faqId) {
  if (!confirm("Are you sure you want to delete this FAQ?")) return;

  try {
    const response = await fetch(`/api/admin/faqs/${faqId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await loadFaqs();
    } else {
      const error = await response.json();
      alert(error.error || "Failed to delete FAQ");
    }
  } catch (error) {
    console.error("Failed to delete FAQ:", error);
    alert("Failed to delete FAQ");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadFaqs();

  saveFaqBtn.addEventListener("click", createFaq);
});
