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
<<<<<<< Updated upstream
    document.getElementById("otpForm").classList.add("hidden");
    const forgotForm = document.getElementById("forgotForm");
    
    if(forgotForm) forgotForm.classList.add("hidden");
    
=======
    
    // 1. Ensure all other forms are hidden
    document.getElementById("forgotForm")?.classList.add("hidden");
    document.getElementById("otpForm")?.classList.add("hidden");
    document.getElementById("resetOtpForm")?.classList.add("hidden");
    document.getElementById("newPasswordForm")?.classList.add("hidden");

>>>>>>> Stashed changes
    clearErrors();
    
    // 2. Only animate Signup out if it's actually visible
    if (!signupForm.classList.contains("hidden")) {
        signupForm.classList.add("slide-out-left");
        setTimeout(() => {
            signupForm.classList.add("hidden");
            signupForm.classList.remove("slide-out-left"); // Cleanup animation class
            loginForm.classList.remove("hidden");
            loginForm.classList.add("slide-in-right");
            setTimeout(() => loginForm.classList.remove("slide-in-right"), 300);
        }, 300);
    } else {
        // 3. Direct switch (e.g., from Forgot Password)
        loginForm.classList.remove("hidden");
        loginForm.classList.add("slide-in-right");
        setTimeout(() => loginForm.classList.remove("slide-in-right"), 300);
    }
}

function showOTP(userId, purpose, email = "") {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("otpForm").classList.remove("hidden");
    
    document.getElementById("otpUserId").value = userId;
    document.getElementById("otpPurpose").value = purpose;
    
    if (email) {
        // Spec: Show masked email (ex: j***@gmail.com)
        const [name, domain] = email.split('@');
        const masked = name.length > 2 ? name[0] + '***' + name[name.length - 1] + '@' + domain : email;
        document.getElementById("otpEmailDisplay").innerText = masked;
    }
    startOtpTimer(); // Start the timer when OTP screen shows
}

function showForgot() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("otpForm").classList.add("hidden");
    document.getElementById("resetOtpForm")?.classList.add("hidden");
    document.getElementById("newPasswordForm")?.classList.add("hidden");
    document.getElementById("forgotForm").classList.remove("hidden");
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

const API_BASE = "http://localhost/WEBPROG_PROJ/BACKEND/API/AUTH";
<<<<<<< Updated upstream
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
=======
>>>>>>> Stashed changes

// ===== LOGIN HANDLER =====
document.getElementById("loginFormElement")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearErrors();

<<<<<<< Updated upstream
    const btn = e.target.querySelector("button[type='submit']");
    setLoading(btn, true, "Signing In...");
=======
    const btn = document.querySelector("#loginFormElement button[type='submit']");
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Signing In...";
>>>>>>> Stashed changes

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
            setLoading(btn, false);
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

<<<<<<< Updated upstream
        // ✅ LOGIN SUCCESS
        if (data.ok) {
            localStorage.setItem("user_id", data.user.id);
            localStorage.setItem("user_name", data.user.username);
            localStorage.setItem("full_display_name", data.user.name);
            localStorage.setItem("user_email", data.user.email);
            
            // FIX: Redirect to Dashboard with feedback
            showSuccess("Login Successful!");
            setTimeout(() => window.location.href = "dashboard.html", 500);
        }
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        setLoading(btn, false);
=======
        // 0. CHECK IF VERIFICATION IS REQUIRED (For unverified logins)
        if (data.require_verification) {
            showSuccess(data.message);
            showOTP(data.temp_user_id, 'register', email);
            return;
        }

        // 1. CHECK IF MFA IS REQUIRED
        if (data.mfa_required) {
            showSuccess("MFA Code sent to email.");
            showOTP(data.temp_user_id, 'login_mfa', email);
            return;
        }

        // 2. NORMAL LOGIN SUCCESS (Fallback)
        if (data.ok) {
            // Save Token & User Object (Required for Garage/Profile)
            if (data.token) localStorage.setItem("auth_token", data.token);
            localStorage.setItem("currentUser", JSON.stringify(data.user));

            // Legacy items for Profile.js
            localStorage.setItem("user_name", data.user.username);
            localStorage.setItem("full_display_name", data.user.name);
            localStorage.setItem("user_email", data.user.email);
            window.location.href = "garage.html";
        }
    } catch (err) {
>>>>>>> Stashed changes
        showSuccess("Server connection error. Check XAMPP.");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
});

// ===== SIGNUP HANDLER =====
document.getElementById("signupFormElement")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearErrors();

<<<<<<< Updated upstream
    const btn = e.target.querySelector("button[type='submit']");
    setLoading(btn, true, "Creating Account...");
=======
    const btn = document.querySelector("#signupFormElement button[type='submit']");
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Creating Account...";
>>>>>>> Stashed changes

    const username = document.getElementById("signupUserCustom")?.value.trim();
    const firstName = document.getElementById("signupFirstName")?.value.trim();
    const lastName = document.getElementById("signupLastName")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim();
    const password = document.getElementById("signupPassword")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;

    if (password !== confirmPassword) {
        setLoading(btn, false);
        showSuccess("Passwords do not match.");
        btn.disabled = false;
        btn.innerText = originalText;
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/register.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, firstName, lastName, email, password, confirmPassword }),
        });

        const data = await res.json().catch(() => null);
        setLoading(btn, false);

        if (!res.ok || !data || data.ok !== true) {
            showSuccess(data?.error || "Signup failed");
            return;
        }

<<<<<<< Updated upstream
        // FIX: Go straight to OTP instead of Login
        if (data.require_verification) {
            showSuccess("Verification code sent to email.");
            showOTP(data.temp_user_id, 'register', data.email);
        } else {
            showSuccess("Account created! Please login.");
            showLogin();
        }
=======
        // CHECK IF VERIFICATION IS REQUIRED
        if (data.require_verification) {
            showSuccess("Verification code sent!");
            showOTP(data.temp_data.user_id, 'register', email);
        } else {
            showSuccess("Account created! Please login.");
            setTimeout(() => showLogin(), 1500); 
        }

>>>>>>> Stashed changes
    } catch (err) {
        setLoading(btn, false);
        showSuccess("Server connection error.");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
});

<<<<<<< Updated upstream
// ===== OTP FORM SUBMIT HANDLER =====
document.getElementById("otpFormElement")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const btn = e.target.querySelector("button[type='submit']");
    setLoading(btn, true, "Verifying...");

    const userId = document.getElementById("otpUserId").value;
    const purpose = document.getElementById("otpPurpose").value;
    const otp = document.getElementById("otpInput").value.trim();
=======
// ===== OTP HANDLER =====
document.getElementById("otpFormElement")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const userId = document.getElementById("otpUserId").value;
    const purpose = document.getElementById("otpPurpose").value;
    const otp = document.getElementById("otpInput").value.trim(); // FIX: Remove spaces

    const btn = document.querySelector("#otpFormElement button[type='submit']");
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Verifying...";
>>>>>>> Stashed changes

    const endpoint = purpose === 'register' ? 'verify_registration.php' : 'verify_mfa.php';

    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
<<<<<<< Updated upstream
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
            setTimeout(() => window.location.href = "dashboard.html", 500);
        } else {
            setLoading(btn, false);
            showSuccess(data.error || "Invalid Code");
        }
    } catch (e) {
        setLoading(btn, false);
        showSuccess("Verification Error");
    }
});

// ===== FORGOT PASSWORD FLOW =====
async function handleForgotRequest(e) {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.innerText = "Sending...";

=======
            body: JSON.stringify({ user_id: userId, otp: otp }),
        });
        const data = await res.json();

        if (data.ok) {
            // Both Register and Login MFA now return a token for auto-login
            if (purpose === 'register' || purpose === 'login_mfa') {
                // Save Session Data
                if (data.token) localStorage.setItem("auth_token", data.token);
                localStorage.setItem("currentUser", JSON.stringify(data.user));
                
                // Legacy items
                localStorage.setItem("user_name", data.user.username);
                localStorage.setItem("full_display_name", data.user.name);
                localStorage.setItem("user_email", data.user.email);
                window.location.href = "garage.html";
            }
        } else { showSuccess(data.error || "Invalid Code"); }
    } catch (e) { showSuccess("Verification Error"); } 
    finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
});

// ===== OTP TIMER & RESEND LOGIC =====
function startOtpTimer() {
    const display = document.getElementById("otpTimerDisplay");
    const resendBtn = document.getElementById("resendOtpBtn");
    
    // 1. Expiry Timer (10 Minutes)
    let duration = 600; // 10 minutes in seconds
    
    // Clear existing intervals if any
    if (window.otpInterval) clearInterval(window.otpInterval);
    
    window.otpInterval = setInterval(() => {
        const m = Math.floor(duration / 60).toString().padStart(2, '0');
        const s = (duration % 60).toString().padStart(2, '0');
        if(display) display.innerText = `Expires in ${m}:${s}`;
        
        if (--duration < 0) {
            clearInterval(window.otpInterval);
            if(display) display.innerText = "Code Expired";
        }
    }, 1000);

    // 2. Resend Cooldown (60 Seconds)
    let cooldown = 60;
    if(resendBtn) {
        resendBtn.disabled = true;
        resendBtn.innerText = `Resend in ${cooldown}s`;
        resendBtn.classList.add("opacity-50");
    }
    
    if (window.resendInterval) clearInterval(window.resendInterval);

    window.resendInterval = setInterval(() => {
        cooldown--;
        if(resendBtn) resendBtn.innerText = `Resend in ${cooldown}s`;
        
        if (cooldown <= 0) {
            clearInterval(window.resendInterval);
            if(resendBtn) {
                resendBtn.disabled = false;
                resendBtn.innerText = "Resend Code";
                resendBtn.classList.remove("opacity-50");
            }
        }
    }, 1000);
}

async function resendOTP() {
    const userId = document.getElementById("otpUserId").value;
    const purpose = document.getElementById("otpPurpose").value;
    
    try {
        const res = await fetch(`${API_BASE}/resend_otp.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, purpose: purpose })
        });
        const data = await res.json();
        if(data.ok) { showSuccess(data.message); startOtpTimer(); } 
        else { showSuccess(data.error); }
    } catch(e) { showSuccess("Connection Error"); }
}

// ===== FORGOT PASSWORD HANDLERS =====

// 1. Send Reset Code
document.getElementById("forgotFormElement")?.addEventListener("submit", async function(e) {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value;
    
>>>>>>> Stashed changes
    try {
        const res = await fetch(`${API_BASE}/forgot_password.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
<<<<<<< Updated upstream
        
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
=======
        if(data.ok) {
            showSuccess(data.message);
            document.getElementById("forgotForm").classList.add("hidden");
            document.getElementById("resetOtpForm").classList.remove("hidden");
            document.getElementById("resetEmailHidden").value = email;
        } else { showSuccess(data.error); }
    } catch(err) { showSuccess("Connection Error"); }
});

// 2. Verify Reset Code
document.getElementById("resetOtpFormElement")?.addEventListener("submit", async function(e) {
    e.preventDefault();
    const email = document.getElementById("resetEmailHidden").value;
    const otp = document.getElementById("resetOtpInput").value;

    try {
        const res = await fetch(`${API_BASE}/verify_reset_otp.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if(data.ok) {
            document.getElementById("resetTokenHidden").value = data.reset_token;
            document.getElementById("resetOtpForm").classList.add("hidden");
            document.getElementById("newPasswordForm").classList.remove("hidden");
        } else { showSuccess(data.error || "Invalid Code"); }
    } catch(err) { showSuccess("Connection Error"); }
});

// 3. Set New Password
document.getElementById("newPasswordFormElement")?.addEventListener("submit", async function(e) {
    e.preventDefault();
    const email = document.getElementById("resetEmailHidden").value;
    const token = document.getElementById("resetTokenHidden").value;
    const newPass = document.getElementById("newPasswordInput").value;
>>>>>>> Stashed changes

    try {
        const res = await fetch(`${API_BASE}/reset_password.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
<<<<<<< Updated upstream
            body: JSON.stringify({ email: tempEmail, reset_token: token, new_password: newPass })
=======
            body: JSON.stringify({ email, reset_token: token, new_password: newPass })
>>>>>>> Stashed changes
        });
        const data = await res.json();
        if(data.ok) {
            showSuccess("Password updated! Please login.");
<<<<<<< Updated upstream
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

// ===== UI HELPER: BUTTON LOADING STATE =====
function setLoading(btn, isLoading, text) {
    if (isLoading) {
        btn.dataset.originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${text}`;
        btn.classList.add("opacity-75", "cursor-not-allowed");
    } else {
        btn.disabled = false;
        btn.innerText = btn.dataset.originalText || "Submit";
        btn.classList.remove("opacity-75", "cursor-not-allowed");
    }
}
=======
            showLogin();
        } else { showSuccess(data.error); }
    } catch(err) { showSuccess("Connection Error"); }
});
>>>>>>> Stashed changes
