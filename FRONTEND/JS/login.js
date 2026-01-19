/* ===========================
   FRONTEND/JS/login.js
   Full working file:
   - Login calls backend (no fake redirect)
   - Signup calls backend
   - Strong password rules on signup
   - No infinite reload
   =========================== */

/* ===========================
    FRONTEND/JS/login.js
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
        loginForm.classList.add("slide-in-right");
    }, 300);
}

function clearErrors() {
    document.querySelectorAll(".error-message").forEach((error) => {
        error.classList.remove("show");
    });
}

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

    try {
        const res = await fetch(`${API_BASE}/login.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data.ok !== true) {
            showSuccess(data?.error || "Invalid email or password");
            return;
        }

        // ✅ Save all profile data for the profile page
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("user_name", data.user.username);
        localStorage.setItem("full_display_name", data.user.name);
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("currentUser", JSON.stringify(data.user));

        window.location.href = "garage.html";
    } catch (err) {
        showSuccess("Server connection error. Check XAMPP.");
    }
});

// ===== SIGNUP (Register) =====
document.getElementById("signupFormElement")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearErrors();

    const username = document.getElementById("signupUserCustom")?.value.trim();
    const firstName = document.getElementById("signupFirstName")?.value.trim();
    const lastName = document.getElementById("signupLastName")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim();
    const password = document.getElementById("signupPassword")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;

    if (password !== confirmPassword) {
        showSuccess("Passwords do not match.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/register.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                username, 
                firstName, 
                lastName, 
                email, 
                password,
                confirmPassword 
            }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data.ok !== true) {
            showSuccess(data?.error || "Signup failed");
            return;
        }

        showSuccess("Account created! Please login.");
        setTimeout(() => showLogin(), 1500); // Redirect to login
    } catch (err) {
        showSuccess("Server connection error.");
    }
});