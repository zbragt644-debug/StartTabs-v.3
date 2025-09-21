const urlItems = document.getElementById("urlItems");
const newUrlInput = document.getElementById("newUrl");
const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn"); // if you keep Save All button; safe if undefined
const toast = document.getElementById("toast");

// Modal
const confirmModal = document.getElementById("confirmModal");
const confirmFavicon = document.getElementById("confirmFavicon");
const confirmSiteName = document.getElementById("confirmSiteName");
const confirmSiteUrl = document.getElementById("confirmSiteUrl");
const confirmCancel = document.getElementById("confirmCancel");
const confirmDelete = document.getElementById("confirmDelete");

let urls = [];
let deletingUrl = null; // store URL being deleted

// Toast
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = "";
  toast.classList.add(type);
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// Normalize
function normalizeUrl(input) {
  if (!input) return null;
  input = input.trim();
  try {
    return new URL(input).href;
  } catch {
    try {
      return new URL("https://" + input).href;
    } catch {
      return null;
    }
  }
}

function getFavicon(url) {
  try {
    return `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`;
  } catch { 
    return "https://via.placeholder.com/16?text=?"; 
  }
}

function getSiteName(url) {
  try { 
    return new URL(url).hostname.replace(/^www\./, ""); 
  }
  catch { 
    return url; 
  }
}

// Render
function renderList() {
  urlItems.innerHTML = "";
  urls.forEach((url, index) => {
    const li = document.createElement("li");
    li.dataset.url = url;

    // drag handle
    const handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.innerHTML = "☰";
    li.appendChild(handle);

    const siteInfo = document.createElement("div");
    siteInfo.className = "site-info";

    const img = document.createElement("img");
    img.src = getFavicon(url);
    img.onerror = () => img.src = "https://via.placeholder.com/16?text=?";

    const textWrapper = document.createElement("div");
    textWrapper.className = "site-text";

    const title = document.createElement("div");
    title.className = "site-title";
    title.textContent = getSiteName(url);

    const shortUrl = document.createElement("div");
    shortUrl.className = "site-url";
    shortUrl.textContent = url;

    textWrapper.appendChild(title);
    textWrapper.appendChild(shortUrl);

    siteInfo.appendChild(img);
    siteInfo.appendChild(textWrapper);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove-btn";
    removeBtn.addEventListener("click", () => {
      // set deletingUrl based on the clicked item
      deletingUrl = url;
      confirmFavicon.src = getFavicon(url);
      confirmSiteName.textContent = getSiteName(url);
      confirmSiteUrl.textContent = url;
      confirmModal.classList.add("visible");
    });

    li.appendChild(siteInfo);
    li.appendChild(removeBtn);
    urlItems.appendChild(li);
  });
}

// Save
function saveUrls(showMessage = true) {
  chrome.storage.sync.set({ urls }, () => {
    if (showMessage) showToast("✅ URLs saved successfully!", "success");
  });
}

// Load
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["urls"], (data) => {
    urls = data.urls || [];
    renderList();

    // Initialize Sortable (make sure Sortable.min.js is loaded before this file)
    if (typeof Sortable !== "undefined") {
      new Sortable(urlItems, {
        animation: 150,
        handle: '.drag-handle', // drag only by handle
        onEnd: () => {
          // Rebuild urls array from DOM order
          urls = Array.from(urlItems.querySelectorAll("li")).map(li => li.dataset.url);
          saveUrls(false);
          showToast("✅ Order updated", "success");
        }
      });
    } else {
      console.warn("Sortable not loaded - drag & drop disabled.");
    }
  });

  // Initialize VANTA background
  VANTA.RINGS({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    backgroundColor: 0x0d0d0d,
    color: 0x3F51B5
  });
});

// Add
addBtn.addEventListener("click", () => {
  const normalized = normalizeUrl(newUrlInput.value);
  if (!normalized) { showToast("❌ Invalid URL", "error"); return; }
  if (urls.includes(normalized)) { showToast("❌ URL already exists", "error"); return; }
  urls.push(normalized);
  newUrlInput.value = "";
  renderList();
  saveUrls(false);
  showToast("✅ URL added", "success");
});

// Modal actions
confirmCancel.addEventListener("click", () => {
  confirmModal.classList.remove("visible");
  deletingUrl = null;
});

confirmDelete.addEventListener("click", () => {
  if (deletingUrl) {
    // Remove by URL (safer than using an index)
    urls = urls.filter(u => u !== deletingUrl);
    renderList();
    saveUrls(false);
    showToast("✅ URL removed", "success");
    deletingUrl = null;
  }
  confirmModal.classList.remove("visible");
});
