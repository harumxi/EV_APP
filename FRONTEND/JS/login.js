/* ===========================
   FRONTEND/JS/login.js
   Full working file:
   - Login calls backend (no fake redirect)
   - Signup calls backend
   - Strong password rules on signup
   - No infinite reload
   =========================== */

console.log("LOGIN.JS LOADED (NEW)");

// Toggle between Login and Signup
function showSignup() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  clearErrors();

  loginForm.classList.add("slide-out-left");
  setTimeout(() => {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    signupForm.classList.remove("slide-out-left");
    signupForm.classList.add("slide-in-right");
  }, 300);
}

function showLogin() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  clearErrors();

  signupForm.classList.add("slide-out-left");
  setTimeout(() => {
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    loginForm.classList.remove("slide-out-left");
    loginForm.classList.add("slide-in-right");
  }, 300);
}

// Toggle password visibility
function togglePassword(fieldId, toggleElement) {
  const field = document.getElementById(fieldId);
  const icon = toggleElement.querySelector(".eye-icon");

  if (!field || !icon) return;

  if (field.type === "password") {
    field.type = "text";
    icon.classList.add("active");
    icon.innerHTML =
      '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
  } else {
    field.type = "password";
    icon.classList.remove("active");
    icon.innerHTML =
      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
  }
}

// Clear all error messages
function clearErrors() {
  document.querySelectorAll(".error-message").forEach((error) => {
    error.classList.remove("show");
  });
}

// Show success/error toast message (your UI uses this)
function showSuccess(message) {
  const successMsg = document.getElementById("successMessage");
  if (!successMsg) {
    alert(message);
    return;
  }
  successMsg.textContent = message;
  successMsg.classList.add("show");
  setTimeout(() => successMsg.classList.remove("show"), 3000);
}

// ===== CONFIG =====
const API_BASE = "http://localhost/WEBPROG_PROJ/BACKEND/api/AUTH";

// ===== LOGIN =====
document.getElementById("loginFormElement")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !email.includes("@")) {
    document.getElementById("loginEmailError")?.classList.add("show");
    showSuccess("Enter a valid email.");
    return;
  }

  if (!password) {
    document.getElementById("loginPasswordError")?.classList.add("show");
    showSuccess("Password is required.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.ok !== true) {
      showSuccess(data?.error || "Invalid email or password");
      return; // ✅ do not proceed
    }

    // ✅ Save real authenticated user
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    // ✅ Proceed only on success
    window.location.href = "garage.html";
  } catch (err) {
    console.error(err);
    showSuccess("Server connection error. Check XAMPP and API path.");
  }
});

// ===== SIGNUP (Register) =====
document.getElementById("signupFormElement")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const password = document.getElementById("signupPassword")?.value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;

  // Password rules: 8+ chars, 1 uppercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  if (!name) {
    document.getElementById("signupNameError")?.classList.add("show");
    showSuccess("Name is required.");
    return;
  }

  if (!email || !email.includes("@")) {
    document.getElementById("signupEmailError")?.classList.add("show");
    showSuccess("Enter a valid email.");
    return;
  }

  if (!passwordRegex.test(password || "")) {
    document.getElementById("signupPasswordError")?.classList.add("show");
    showSuccess("Password must be 8+ chars and include 1 uppercase, 1 number, and 1 special character.");
    return;
  }

  if ((password || "") !== (confirmPassword || "")) {
    document.getElementById("confirmPasswordError")?.classList.add("show");
    showSuccess("Passwords do not match.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/register.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.ok !== true) {
      showSuccess(data?.error || "Signup failed");
      return;
    }

    showSuccess("Account created! Please login.");
    showLogin();
  } catch (err) {
    console.error(err);
    showSuccess("Server connection error. Check XAMPP and API path.");
  }
});

// Handle Forgot Password (demo only)
function handleForgotPassword() {
  const email = document.getElementById("loginEmail")?.value;
  if (email) showSuccess(`Password reset link sent to ${email}`);
  else showSuccess("Please enter your email address first");
}

// Add input focus animations
document.querySelectorAll(".input-field").forEach((input) => {
  input.addEventListener("focus", function () {
    const label = this.parentElement?.parentElement?.querySelector(".input-label");
    if (label) label.style.color = "var(--racing-red)";
  });
  input.addEventListener("blur", function () {
    const label = this.parentElement?.parentElement?.querySelector(".input-label");
    if (label && !this.value) label.style.color = "var(--steel-grey)";
  });
});
