/* ===========================
    FRONTEND/JS/login.js
   =========================== */

console.log("LOGIN.JS LOADED (FIXED FLOW)");

// Toggle functions
function showSignup() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    document.getElementById("otpForm").classList.add("hidden");
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
    document.getElementById("otpForm").classList.add("hidden");
    const forgotForm = document.getElementById("forgotForm");
    
    if(forgotForm) forgotForm.classList.add("hidden");
    
    clearErrors();
    signupForm.classList.add("slide-out-left");
    setTimeout(() => {
        signupForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        loginForm.classList.add("slide-in-right");
    }, 300);
}

function showForgot() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("forgotForm").classList.remove("hidden");
    switchForgotStep(1);
}

function showOTP(userId, purpose, email = "") {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("otpForm").classList.remove("hidden");
    
    document.getElementById("otpUserId").value = userId;
    document.getElementById("otpPurpose").value = purpose;
    
    if (email) {
        document.getElementById("otpEmailDisplay").innerText = email;
    }
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
    
    // Clear previous timeout to prevent glitches
    if (successMsg.hideTimeout) clearTimeout(successMsg.hideTimeout);
    successMsg.hideTimeout = setTimeout(() => successMsg.classList.remove("show"), 3000);
}

// FIX: Ensure API path is correct (Uppercase API)
const API_BASE = "http://localhost/WEBPROG_PROJ/BACKEND/API/AUTH";
let tempUserId = null;
let tempEmail = null;

// ===== OTP SENDER (Smart) =====
async function sendOtpAsync(userId, purpose) {
    try {
        const res = await fetch(`${API_BASE}/resend_otp.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, purpose: purpose })
        });
        const data = await res.json();
        
        if (data.ok) {
            showSuccess("Verification code sent to email.");
        } else {
            // If rate limited (e.g. user just registered), don't show error, just log it.
            // This prevents "Please wait 60s" error appearing immediately after registration.
            console.log("OTP Send Status:", data.error);
        }
    } catch (e) {
        console.error("OTP Send Error", e);
    }
}

// ===== LOGIN HANDLER =====
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
            // Handle specific "require_verification" case from login.php
            if (data && data.require_verification) {
                tempUserId = data.user_id;
                tempEmail = data.email;
                
                // FIX: Trigger OTP email here because login.php doesn't send it anymore
                sendOtpAsync(tempUserId, 'register');
                showOTP(tempUserId, 'register', tempEmail);
                return;
            }
            
            showSuccess(data?.error || "Invalid email or password");
            return;
        }

        // ✅ LOGIN SUCCESS
        if (data.ok) {
            localStorage.setItem("user_id", data.user.id);
            localStorage.setItem("user_name", data.user.username);
            localStorage.setItem("full_display_name", data.user.name);
            localStorage.setItem("user_email", data.user.email);
            
            // FIX: Redirect to Dashboard
            window.location.href = "dashboard.html";
        }
    } catch (err) {
        showSuccess("Server connection error. Check XAMPP.");
    }
});

// ===== SIGNUP HANDLER =====
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
            body: JSON.stringify({ username, firstName, lastName, email, password, confirmPassword }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data.ok !== true) {
            showSuccess(data?.error || "Signup failed");
            return;
        }

        // FIX: Redirect to Login instead of showing OTP immediately
        if (data.require_verification) {
            showSuccess("Account created successfully! Please sign in.");
            showLogin(); 
        } else {
            showSuccess("Account created! Please login.");
            showLogin();
        }
    } catch (err) {
        showSuccess("Server connection error.");
    }
});

// ===== OTP FORM SUBMIT HANDLER =====
document.getElementById("otpFormElement")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const userId = document.getElementById("otpUserId").value;
    const purpose = document.getElementById("otpPurpose").value;
    const otp = document.getElementById("otpInput").value.trim();

    const endpoint = purpose === 'register' ? 'verify_registration.php' : 'verify_mfa.php';

    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, otp: otp })
        });

        const data = await res.json();

        if (data.ok) {
            showSuccess("Verified! Logging in...");
            // Save session data
            localStorage.setItem("user_id", data.user.id);
            localStorage.setItem("user_name", data.user.username);
            localStorage.setItem("full_display_name", data.user.name);
            localStorage.setItem("user_email", data.user.email);
            
            // FIX: Redirect to Dashboard
            window.location.href = "dashboard.html";
        } else {
            showSuccess(data.error || "Invalid Code");
        }
    } catch (e) {
        showSuccess("Verification Error");
    }
});

// ===== FORGOT PASSWORD FLOW =====
async function handleForgotRequest(e) {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.innerText = "Sending...";

    try {
        const res = await fetch(`${API_BASE}/forgot_password.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        if(data.ok) {
            tempEmail = email;
            showSuccess("Code sent! Check your inbox.");
            switchForgotStep(2);
        } else {
            showSuccess(data.error || "Error sending code");
        }
    } catch(err) { showSuccess("Connection error"); }
    finally { btn.disabled = false; btn.innerText = "Send Reset Code"; }
}

async function handleForgotVerify(e) {
    e.preventDefault();
    const otp = document.getElementById("forgotOtp").value.trim();
    try {
        const res = await fetch(`${API_BASE}/verify_reset_otp.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: tempEmail, otp })
        });
        const data = await res.json();
        if(data.ok) {
            document.getElementById("resetToken").value = data.reset_token;
            switchForgotStep(3);
        } else {
            showSuccess(data.error || "Invalid Code");
        }
    } catch(err) { showSuccess("Connection error"); }
}

async function handleNewPassword(e) {
    e.preventDefault();
    const newPass = document.getElementById("newPass").value;
    const confirmPass = document.getElementById("confirmNewPass").value;
    const token = document.getElementById("resetToken").value;

    if(newPass !== confirmPass) return showSuccess("Passwords do not match");

    try {
        const res = await fetch(`${API_BASE}/reset_password.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: tempEmail, reset_token: token, new_password: newPass })
        });
        const data = await res.json();
        if(data.ok) {
            showSuccess("Password updated! Please login.");
            setTimeout(() => showLogin(), 2000);
        } else {
            showSuccess(data.error || "Update failed");
        }
    } catch(err) { showSuccess("Connection error"); }
}

function switchForgotStep(step) {
    document.getElementById("forgotStep1").classList.add("hidden");
    document.getElementById("forgotStep2").classList.add("hidden");
    document.getElementById("forgotStep3").classList.add("hidden");
    if(step === 1) document.getElementById("forgotStep1").classList.remove("hidden");
    if(step === 2) document.getElementById("forgotStep2").classList.remove("hidden");
    if(step === 3) document.getElementById("forgotStep3").classList.remove("hidden");
}
