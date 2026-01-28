// c:\Users\Alexa\Documents\GitHub\EV_APP\FRONTEND\JS\profile.js

lucide.createIcons();

// Initialize state from localStorage (Backend Logic Preservation)
const storedName = localStorage.getItem("full_display_name") || "User";
const storedUsername = localStorage.getItem("user_name") || "username";

const state = {
  editing: false,
  profile: {
    name: storedName,
    username: storedUsername,
    avatarUrl: "https://i.pravatar.cc/256?img=12",
    coverUrl:
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=2000&q=80",
    coverPositionY: 50,
  },
  draft: null,
  objectUrls: [],
};

if (!String(state.profile.coverUrl).includes("unsplash.com")) {
  state.profile.coverUrl =
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=2000&q=80";
}

state.draft = JSON.parse(JSON.stringify(state.profile));

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).slice(0, 2);
  const out = parts.map((p) => (p ? p[0].toUpperCase() : "")).join("");
  return out || "U";
}

function sanitizeUsername(input) {
  const raw = String(input || "").toLowerCase();
  const allowed = raw.replace(/[^a-z0-9_\.]/g, "");
  const noConsecutiveDots = allowed.replace(/\.{2,}/g, ".");
  const trimmedDots = noConsecutiveDots.replace(/^\.+|\.+$/g, "");
  return trimmedDots.slice(0, 20);
}

function isDirty() {
  return JSON.stringify(state.profile) !== JSON.stringify(state.draft);
}

function setEditing(v) {
  state.editing = v;

  document.getElementById("editBtn").classList.toggle("hidden", v);
  document.getElementById("saveBtn").classList.toggle("hidden", !v);
  document.getElementById("cancelBtn").classList.toggle("hidden", !v);

  ["nameInput", "usernameInput"].forEach((id) => {
    document.getElementById(id).disabled = !v;
  });

  const coverBtn = document.getElementById("coverUploadBtn");
  const avatarBtn = document.getElementById("avatarUploadBtn");
  const coverContainer = document.getElementById("coverContainer");
  const dragHint = document.getElementById("dragHint");

  const coverBg = document.getElementById("coverBg");
  if (coverBg) {
    if (v) coverBg.classList.remove("group-hover:scale-105");
    else coverBg.classList.add("group-hover:scale-105");
  }

  coverBtn.setAttribute("aria-disabled", v ? "false" : "true");
  avatarBtn.setAttribute("aria-disabled", v ? "false" : "true");
  coverBtn.title = v ? "Change cover" : "Enable edit mode to change cover";
  avatarBtn.title = v ? "Change photo" : "Enable edit mode to change photo";

  if (coverContainer) coverContainer.style.cursor = v ? "grab" : "default";
  if (dragHint) dragHint.style.opacity = v ? "1" : "0";

  syncUI();
}

function syncUI() {
  const coverBg = document.getElementById("coverBg");
  if (coverBg) {
    coverBg.style.backgroundImage = `url('${state.draft.coverUrl}')`;
    coverBg.style.backgroundPosition = `center ${state.draft.coverPositionY}%`;
  }

  document.getElementById("avatarImg").src = state.draft.avatarUrl;

  document.getElementById("nameInput").value = state.draft.name;
  document.getElementById("usernameInput").value = state.draft.username;

  document.getElementById("nameDisplay").textContent = state.draft.name;
  document.getElementById("userDisplay").textContent = "@" + state.draft.username;

  document.getElementById("headerInitials").textContent = initials(state.profile.name);

  const dirty = isDirty();

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.style.opacity = state.editing && dirty ? "1" : "0.5";
  saveBtn.style.pointerEvents = state.editing && dirty ? "auto" : "none";
}

function pickImage(file, kind) {
  const url = URL.createObjectURL(file);
  state.objectUrls.push(url);

  if (kind === "cover") {
    state.draft.coverUrl = url;
    state.draft.coverPositionY = 50;
  }
  if (kind === "avatar") state.draft.avatarUrl = url;

  syncUI();
}

function cleanupObjectUrls() {
  state.objectUrls.forEach((u) => URL.revokeObjectURL(u));
  state.objectUrls = [];
}

const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
const profilePanel = document.getElementById("tab-profile");

function setTab(name) {
  profilePanel.classList.toggle("hidden", name !== "profile");
  tabButtons.forEach((b) => {
    const active = b.getAttribute("data-tab") === name;
    b.setAttribute("aria-selected", active ? "true" : "false");
  });
}

tabButtons.forEach((b) => {
  b.addEventListener("click", () => setTab(b.getAttribute("data-tab")));
});

document.getElementById("editBtn").addEventListener("click", () => setEditing(true));

document.getElementById("cancelBtn").addEventListener("click", () => {
  cleanupObjectUrls();
  state.draft = JSON.parse(JSON.stringify(state.profile));
  setEditing(false);
  syncUI();
});

document.getElementById("saveBtn").addEventListener("click", () => {
  if (!state.editing) return;
  if (!isDirty()) return;
  state.profile = JSON.parse(JSON.stringify(state.draft));
  
  // Update LocalStorage (Backend Logic)
  localStorage.setItem("full_display_name", state.profile.name);
  localStorage.setItem("user_name", state.profile.username);
  
  cleanupObjectUrls();
  setEditing(false);
  syncUI();
});

document.getElementById("nameInput").addEventListener("input", (e) => {
  state.draft.name = e.target.value;
  syncUI();
});

document.getElementById("usernameInput").addEventListener("input", (e) => {
  const v = sanitizeUsername(e.target.value);
  state.draft.username = v;
  e.target.value = v;
  syncUI();
});

const coverInput = document.getElementById("coverInput");
const avatarInput = document.getElementById("avatarInput");

document.getElementById("coverUploadBtn").addEventListener("click", () => {
  if (!state.editing) return;
  coverInput.click();
});

document.getElementById("avatarUploadBtn").addEventListener("click", () => {
  if (!state.editing) return;
  avatarInput.click();
});

coverInput.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  pickImage(f, "cover");
  e.target.value = "";
});

avatarInput.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  pickImage(f, "avatar");
  e.target.value = "";
});

setTab("profile");
setEditing(false);
syncUI();

// --- Cover Drag Logic ---
const coverContainer = document.getElementById("coverContainer");
const coverBg = document.getElementById("coverBg");
let isDragging = false;
let startY = 0;
let startPercent = 50;
let dragImageHeight = 0;
let dragContainerHeight = 0;

if (coverContainer && coverBg) {
  const startDrag = (y) => {
    if (!state.editing) return;
    
    const img = new Image();
    img.src = state.draft.coverUrl;
    
    const run = () => {
      const containerAspect = coverContainer.offsetWidth / coverContainer.offsetHeight;
      const imageAspect = img.naturalWidth / img.naturalHeight;
      
      if (imageAspect >= containerAspect) return;

      isDragging = true;
      startY = y;
      startPercent = state.draft.coverPositionY;
      dragImageHeight = coverContainer.offsetWidth / imageAspect;
      dragContainerHeight = coverContainer.offsetHeight;
      coverContainer.style.cursor = "grabbing";
    };

    if (img.complete) run();
    else img.onload = run;
  };

  const moveDrag = (y, e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const deltaY = y - startY;
    const overflowH = dragImageHeight - dragContainerHeight;

    if (overflowH <= 0) return;

    const percentChange = (deltaY / overflowH) * 100;
    let newPercent = startPercent - percentChange;
    newPercent = Math.max(0, Math.min(100, newPercent));

    state.draft.coverPositionY = newPercent;
    coverBg.style.backgroundPosition = `center ${newPercent}%`;
  };

  const endDrag = () => {
    isDragging = false;
    if (state.editing) coverContainer.style.cursor = "grab";
  };

  coverContainer.addEventListener("mousedown", (e) => startDrag(e.clientY));
  window.addEventListener("mousemove", (e) => moveDrag(e.clientY, e));
  window.addEventListener("mouseup", endDrag);

  coverContainer.addEventListener("touchstart", (e) => startDrag(e.touches[0].clientY), { passive: false });
  window.addEventListener("touchmove", (e) => moveDrag(e.touches[0].clientY, e), { passive: false });
  window.addEventListener("touchend", endDrag);
}

// --- Preferences Accordion Logic ---
const prefAccordion = document.getElementById("prefAccordion");
const prefTrigger = document.getElementById("prefTrigger");
const darkModeToggle = document.getElementById("darkModeToggle");
const unitsSelect = document.getElementById("unitsSelect");

if (prefTrigger && prefAccordion) {
  prefTrigger.addEventListener("click", () => {
    prefAccordion.classList.toggle("acc-open");
  });
}

if (darkModeToggle) {
  const isDark = localStorage.getItem("theme") === "dark";
  darkModeToggle.checked = isDark;
  if (isDark) document.documentElement.classList.add("dark");

  darkModeToggle.addEventListener("change", (e) => {
    const dark = e.target.checked;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  });
}

if (unitsSelect) {
  unitsSelect.value = localStorage.getItem("units") || "metric";
  unitsSelect.addEventListener("change", (e) => {
    localStorage.setItem("units", e.target.value);
    // Sync for other pages
    localStorage.setItem("pref_units", e.target.value === 'imperial' ? 'MILES' : 'KM');
  });
}

// --- Password Accordion Logic ---
const pwAccordion = document.getElementById("pwAccordion");
const pwTrigger = document.getElementById("pwTrigger");

if (pwTrigger && pwAccordion) {
  pwTrigger.addEventListener("click", () => {
    pwAccordion.classList.toggle("acc-open");
  });
}

// Eye toggle logic
document.querySelectorAll("[data-eye]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.eye;
    const inp = document.getElementById(id);
    if (!inp) return;
    const isPw = inp.type === "password";
    inp.type = isPw ? "text" : "password";
    btn.innerHTML = isPw
      ? '<i data-lucide="eye-off" class="h-4 w-4"></i>'
      : '<i data-lucide="eye" class="h-4 w-4"></i>';
    lucide.createIcons();
  });
});

// Password validation
const currentPw = document.getElementById("currentPw");
const newPw = document.getElementById("newPw");
const savePwBtn = document.getElementById("savePwBtn");
const pwStep1 = document.getElementById("pwStep1");
const pwStep2 = document.getElementById("pwStep2");
const otpDigits = document.querySelectorAll(".otp-digit");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const cancelOtpBtn = document.getElementById("cancelOtpBtn");
const resendOtpBtn = document.getElementById("resendOtpBtn");
let otpTimerInterval;

function validatePw() {
  const c = currentPw.value.trim();
  const n = newPw.value.trim();
  const ok = c.length > 0 && n.length >= 8;
  savePwBtn.style.opacity = ok ? "1" : "0.5";
  savePwBtn.style.pointerEvents = ok ? "auto" : "none";
}

function startOtpTimer() {
  let timeLeft = 60;
  if (!resendOtpBtn) return;
  resendOtpBtn.disabled = true;
  resendOtpBtn.textContent = `Resend code in s`;
  
  clearInterval(otpTimerInterval);
  otpTimerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(otpTimerInterval);
      resendOtpBtn.disabled = false;
      resendOtpBtn.textContent = "Resend code";
    } else {
      resendOtpBtn.textContent = `Resend code in s`;
    }
  }, 1000);
}

function checkOtp() {
  const val = Array.from(otpDigits).map(d => d.value).join("");
  const ok = val.length === 6;
  verifyOtpBtn.style.opacity = ok ? "1" : "0.5";
  verifyOtpBtn.style.pointerEvents = ok ? "auto" : "none";
}

if (currentPw && newPw) {
  [currentPw, newPw].forEach((el) => el.addEventListener("input", validatePw));
  
  savePwBtn.addEventListener("click", () => {
    pwStep1.classList.add("hidden");
    pwStep2.classList.remove("hidden");
    
    const toast = document.createElement("div");
    toast.className = "fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-xs shadow-lg z-50";
    toast.textContent = "OTP sent to email";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
    
    otpDigits.forEach(d => d.value = "");
    if (otpDigits[0]) otpDigits[0].focus();
    startOtpTimer();
  });

  otpDigits.forEach((digit, idx) => {
    digit.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      if (e.target.value) {
        if (idx < otpDigits.length - 1) otpDigits[idx + 1].focus();
      }
      checkOtp();
    });
    
    digit.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value) {
        if (idx > 0) otpDigits[idx - 1].focus();
      }
    });
    
    digit.addEventListener("paste", (e) => {
      e.preventDefault();
      const data = (e.clipboardData || window.clipboardData).getData("text");
      const nums = data.replace(/[^0-9]/g, "").split("").slice(0, 6);
      nums.forEach((n, i) => {
        if (otpDigits[i]) otpDigits[i].value = n;
      });
      checkOtp();
      const next = nums.length < 6 ? nums.length : 5;
      if (otpDigits[next]) otpDigits[next].focus();
    });
  });

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", () => {
      const toast = document.createElement("div");
      toast.className = "fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-xs shadow-lg z-50";
      toast.textContent = "New code sent";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
      startOtpTimer();
    });
  }

  cancelOtpBtn.addEventListener("click", () => {
    pwStep1.classList.remove("hidden");
    pwStep2.classList.add("hidden");
    otpDigits.forEach(d => d.value = "");
    clearInterval(otpTimerInterval);
  });

  verifyOtpBtn.addEventListener("click", () => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-xs shadow-lg z-50";
    toast.textContent = "Password updated successfully";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);

    currentPw.value = "";
    newPw.value = "";
    validatePw();
    pwAccordion.classList.remove("acc-open");
    clearInterval(otpTimerInterval);
    
    setTimeout(() => {
      pwStep1.classList.remove("hidden");
      pwStep2.classList.add("hidden");
      otpDigits.forEach(d => d.value = "");
    }, 300);
  });
}

// Logout Logic
const logoutBtn = document.getElementById("logoutBtn");

function showLogoutConfirmation() {
  const backdrop = document.createElement("div");
  backdrop.className = "fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-200";
  
  const modal = document.createElement("div");
  modal.className = "w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl transform transition-all scale-100";
  
  modal.innerHTML = `
    <div class="text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900">Log out?</h3>
      <p class="mt-2 text-sm text-gray-500">
        Are you sure you want to log out?
      </p>
    </div>
    <div class="mt-6 grid grid-cols-2 gap-3">
      <button id="cancelLogoutAction" class="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
        Cancel
      </button>
      <button id="confirmLogoutAction" class="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm">
        Log out
      </button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const close = () => {
    backdrop.style.opacity = "0";
    setTimeout(() => backdrop.remove(), 200);
  };

  document.getElementById("cancelLogoutAction").addEventListener("click", close);
  
  document.getElementById("confirmLogoutAction").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showLogoutConfirmation();
  });
}

// About Drawer Logic
const aboutDrawer = document.getElementById("aboutDrawer");
const aboutBackdrop = document.getElementById("aboutBackdrop");
const aboutPanel = document.getElementById("aboutPanel");
const openAboutBtn = document.getElementById("openAboutBtn");
const closeAboutBtn = document.getElementById("closeAboutDrawer");
const aboutOk = document.getElementById("aboutOk");

if (openAboutBtn && aboutDrawer && aboutPanel && aboutBackdrop) {
  const openDrawer = () => {
    aboutDrawer.classList.remove("hidden");
    void aboutDrawer.offsetWidth;
    aboutBackdrop.classList.remove("opacity-0");
    aboutPanel.classList.remove("translate-x-full");
  };

  const closeDrawer = () => {
    aboutBackdrop.classList.add("opacity-0");
    aboutPanel.classList.add("translate-x-full");
    setTimeout(() => {
      aboutDrawer.classList.add("hidden");
    }, 300);
  };

  openAboutBtn.addEventListener("click", openDrawer);
  if (closeAboutBtn) closeAboutBtn.addEventListener("click", closeDrawer);
  if (aboutOk) aboutOk.addEventListener("click", closeDrawer);
  aboutBackdrop.addEventListener("click", closeDrawer);
}

// Help/FAQ Drawer Logic
const helpDrawer = document.getElementById("helpDrawer");
const helpBackdrop = document.getElementById("helpBackdrop");
const helpPanel = document.getElementById("helpPanel");
const openHelpBtn = document.getElementById("openHelpBtn");
const closeHelpBtn = document.getElementById("closeHelpDrawer");
const helpOk = document.getElementById("helpOk");
const faqList = document.getElementById("faqList");
const faqSearch = document.getElementById("faqSearch");

if (openHelpBtn && helpDrawer && helpPanel && helpBackdrop) {
  const openDrawer = () => {
    helpDrawer.classList.remove("hidden");
    void helpDrawer.offsetWidth;
    helpBackdrop.classList.remove("opacity-0");
    helpPanel.classList.remove("translate-x-full");
    if (window.lucide) window.lucide.createIcons();
  };

  const closeDrawer = () => {
    helpBackdrop.classList.add("opacity-0");
    helpPanel.classList.add("translate-x-full");
    setTimeout(() => {
      helpDrawer.classList.add("hidden");
    }, 300);
  };

  openHelpBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openDrawer();
  });
  if (closeHelpBtn) closeHelpBtn.addEventListener("click", closeDrawer);
  if (helpOk) helpOk.addEventListener("click", closeDrawer);
  helpBackdrop.addEventListener("click", closeDrawer);

  if (faqList) {
    faqList.addEventListener("click", (e) => {
      const btn = e.target.closest(".faq-btn");
      if (!btn) return;
      
      const item = btn.closest(".faq-item");
      const answer = item.querySelector(".faq-answer");
      const chevron = item.querySelector(".faq-chevron");
      
      const isHidden = answer.classList.contains("hidden");
      answer.classList.toggle("hidden", !isHidden);
      chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    });
  }

  if (faqSearch && faqList) {
    faqSearch.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      faqList.querySelectorAll(".faq-item").forEach((item) => {
        const text = item.getAttribute("data-q").toLowerCase();
        item.classList.toggle("hidden", q && !text.includes(q));
      });
    });
  }
}

// --- Garage Accordion Logic ---
const garageAccordion = document.getElementById("garageAccordion");
const garageTrigger = document.getElementById("garageTrigger");
const garageList = document.getElementById("garageList");

if (garageTrigger && garageAccordion) {
  garageTrigger.addEventListener("click", () => {
    const isOpen = garageAccordion.classList.toggle("acc-open");
    if (isOpen) {
        loadGaragePreview();
    }
  });
}

async function loadGaragePreview() {
    if (!garageList) return;
    const userId = localStorage.getItem("user_id");
    if (!userId) {
        garageList.innerHTML = '<div class="text-center text-xs text-gray-500">Please log in.</div>';
        return;
    }

    try {
        const res = await fetch(`http://localhost/WEBPROG_PROJ/BACKEND/API/GARAGE/get_user_garage.php?user_id=${userId}`);
        const json = await res.json();
        
        if (json.ok && json.data && json.data.length > 0) {
            garageList.innerHTML = json.data.map(car => `
                <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200">
                    <img src="${car.image}" class="w-10 h-10 rounded-lg object-cover bg-gray-100" onerror="this.style.display='none'">
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-semibold text-gray-900 truncate">${car.brand} ${car.model}</div>
                        <div class="text-xs text-gray-500">${car.year} • ${Math.round(car.range_km)} km</div>
                    </div>
                    ${car.is_active == 1 ? '<span class="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>' : ''}
                </div>
            `).join('');
        } else {
            garageList.innerHTML = '<div class="text-center text-xs text-gray-500 py-2">No cars found.</div>';
        }
    } catch (e) {
        console.error(e);
        garageList.innerHTML = '<div class="text-center text-xs text-red-500">Failed to load garage.</div>';
    }
}

// --- Emergency Accordion Logic ---
const emergencyAccordion = document.getElementById("emergencyAccordion");
const emergencyTrigger = document.getElementById("emergencyTrigger");
const emergencyList = document.getElementById("emergencyList");
const emergencyEmailInput = document.getElementById("emergencyEmailInput");
const addEmergencyBtn = document.getElementById("addEmergencyBtn");

if (emergencyTrigger && emergencyAccordion) {
  emergencyTrigger.addEventListener("click", () => {
    const isOpen = emergencyAccordion.classList.toggle("acc-open");
    if (isOpen) {
      renderEmergencyContacts();
    }
  });
}

function renderEmergencyContacts() {
  if (!emergencyList) return;
  const contacts = JSON.parse(localStorage.getItem("emergency_contacts_") || "[]");
  
  if (contacts.length === 0) {
    emergencyList.innerHTML = '<div class="text-center text-xs text-gray-500 py-2">No emergency contacts added.</div>';
    return;
  }

  emergencyList.innerHTML = contacts.map((email, index) => `
    <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
      <div class="flex items-center gap-3 min-w-0">
        <div class="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0 dark:bg-red-900/20 dark:text-red-400">
          <i data-lucide="mail" class="h-4 w-4"></i>
        </div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-gray-900 dark:text-slate-200">${email}</div>
          <div class="flex items-center gap-1 mt-0.5">
            <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-slate-400">Active</span>
          </div>
        </div>
      </div>
      <button onclick="removeEmergencyContact(${index})" class="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all dark:hover:bg-red-900/20">
        <i data-lucide="trash-2" class="h-4 w-4"></i>
      </button>
    </div>
  `).join('');
  
  if (window.lucide) lucide.createIcons();
}

if (addEmergencyBtn) {
  addEmergencyBtn.addEventListener("click", () => {
    const email = emergencyEmailInput.value.trim();
    if (!email || !email.includes('@')) return;

    let contacts = JSON.parse(localStorage.getItem("emergency_contacts_") || "[]");
    if (contacts.includes(email)) return;

    contacts.push(email);
    localStorage.setItem("emergency_contacts_", JSON.stringify(contacts));
    emergencyEmailInput.value = "";
    renderEmergencyContacts();
    
    const toast = document.createElement("div");
    toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-2xl z-[100]";
    toast.textContent = "Contact invited & saved";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  });
}

window.removeEmergencyContact = (index) => {
  const backdrop = document.createElement("div");
  backdrop.className = "fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-200";
  
  const modal = document.createElement("div");
  modal.className = "w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl transform transition-all scale-100 dark:bg-slate-900 dark:border dark:border-slate-800";
  
  modal.innerHTML = `
    <div class="text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <i data-lucide="trash-2" class="h-6 w-6 text-red-600 dark:text-red-400"></i>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Remove Contact?</h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
        Are you sure you want to remove this emergency contact?
      </p>
    </div>
    <div class="mt-6 grid grid-cols-2 gap-3">
      <button id="cancelDeleteContact" class="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
        Cancel
      </button>
      <button id="confirmDeleteContact" class="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm">
        Remove
      </button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  if (window.lucide) lucide.createIcons();

  const close = () => {
    backdrop.style.opacity = "0";
    setTimeout(() => backdrop.remove(), 200);
  };

  document.getElementById("cancelDeleteContact").addEventListener("click", close);
  document.getElementById("confirmDeleteContact").addEventListener("click", () => {
    let contacts = JSON.parse(localStorage.getItem("emergency_contacts_") || "[]");
    contacts.splice(index, 1);
    localStorage.setItem("emergency_contacts_", JSON.stringify(contacts));
    renderEmergencyContacts();
    close();
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
};
