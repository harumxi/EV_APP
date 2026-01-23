/* ===========================
    FRONTEND/JS/login.js
   =========================== */

console.log("LOGIN.JS LOADED (FIXED FLOW)");

const API_BASE = "../../BACKEND/API/AUTH";
let tempUserId = null;
let tempEmail = null;

// ===== UI TOGGLE FUNCTIONS =====
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
    
    if (!signupForm.classList.contains("hidden")) {
        signupForm.classList.add("slide-out-left");
        setTimeout(() => {
            signupForm.classList.add("hidden");
            signupForm.classList.remove("slide-out-left"); 
            loginForm.classList.remove("hidden");
            loginForm.classList.add("slide-in-right");
            setTimeout(() => loginForm.classList.remove("slide-in-right"), 300);
        }, 300);
    } else {
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
        const [name, domain] = email.split('@');
        const masked = name.length > 2 ? name[0] + '***' + name[name.length - 1] + '@' + domain : email;
        document.getElementById("otpEmailDisplay").innerText = masked;
    }
    startOtpTimer();
}

function showForgot() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("forgotForm").classList.remove("hidden");
    switchForgotStep(1);
}

// ===== UI HELPERS =====
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
    
    if (successMsg.hideTimeout) clearTimeout(successMsg.hideTimeout);
    successMsg.hideTimeout = setTimeout(() => successMsg.classList.remove("show"), 3000);
}

function setLoading(btn, isLoading, text = "Submit") {
    if (!btn) return;
    if (isLoading) {
        btn.dataset.originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${text}`;
        btn.classList.add("opacity-75", "cursor-not-allowed");
    } else {
        btn.disabled = false;
        btn.innerText = btn.dataset.originalText || text;
        btn.classList.remove("opacity-75", "cursor-not-allowed");
    }
}

// ===== AUTH HANDLERS =====

// LOGIN
document.getElementById("loginFormElement")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearErrors();
    const btn = e.target.querySelector("button[type='submit']");
    setLoading(btn, true, "Signing In...");

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    try {
        const res = await fetch(`${API_BASE}/login.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (data.ok) {
            console.log("Login Data:", data.user); // Debugging: Check console to see what fields are returned
            localStorage.setItem("user_id", data.user.id);
            localStorage.setItem("user_name", data.user.username);
            localStorage.setItem("user_email", data.user.email);
            let fName = data.user.first_name || data.user.firstName || data.user.firstname || data.user.Firstname || '';
            let lName = data.user.last_name || data.user.lastName || data.user.lastname || data.user.Lastname || '';
            
            // Fallback: If separate fields are missing, try to split 'name'
            if (!fName && data.user.name) {
                const parts = data.user.name.trim().split(' ');
                fName = parts[0];
                lName = parts.slice(1).join(' ');
            }
            
            localStorage.setItem("first_name", fName);
            localStorage.setItem("last_name", lName);

            const fullName = `${fName} ${lName}`.trim();
            localStorage.setItem("full_display_name", fullName || data.user.full_name || "");

            showSuccess("Login Successful!");
            setTimeout(() => window.location.href = "dashboard.html", 500);
        } else if (data.require_verification) {
            tempUserId = data.user_id;
            tempEmail = data.email;
            await sendOtpAsync(tempUserId, 'register');
            showOTP(tempUserId, 'register', tempEmail);
        } else {
            showSuccess(data.error || "Invalid Credentials");
        }
    } catch (err) {
        console.error("Login Error:", err);
        showSuccess(`Connection Failed: ${err.message}`);
    } finally {
        setLoading(btn, false);
    }
});

// SIGNUP
document.getElementById("signupFormElement")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    setLoading(btn, true, "Creating Account...");

    const payload = {
        username: document.getElementById("signupUserCustom")?.value.trim(),
        firstName: document.getElementById("signupFirstName")?.value.trim(),
        lastName: document.getElementById("signupLastName")?.value.trim(),
        email: document.getElementById("signupEmail")?.value.trim(),
        password: document.getElementById("signupPassword")?.value,
        confirmPassword: document.getElementById("confirmPassword")?.value
    };

    if (payload.password !== payload.confirmPassword) {
        setLoading(btn, false);
        return showSuccess("Passwords do not match.");
    }

    try {
        const res = await fetch(`${API_BASE}/register.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok && data.require_verification) {
            showOTP(data.temp_user_id, 'register', data.email);
        } else {
            showSuccess(data.error || "Signup failed");
        }
    } catch (err) {
        console.error("Signup Error:", err);
        showSuccess(`Connection Failed: ${err.message}`);
    } finally {
        setLoading(btn, false);
    }
});

// OTP VERIFICATION
document.getElementById("otpFormElement")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    setLoading(btn, true, "Verifying...");

    const payload = {
        user_id: document.getElementById("otpUserId").value,
        otp: document.getElementById("otpInput").value.trim()
    };
    const purpose = document.getElementById("otpPurpose").value;
    const endpoint = purpose === 'register' ? 'verify_registration.php' : 'verify_mfa.php';

    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ok) {
/* c:\Users\Stephanie\Documents\GitHub\WEBPROG_PROJ\FRONTEND\JS\login.js */
            if (purpose === 'register') {
                showSuccess("Account verified! Please login.");
                showLogin();
            } else {
                console.log("OTP Login Data:", data.user); // Debugging
                localStorage.setItem("user_id", data.user.id);
                localStorage.setItem("user_name", data.user.username);
                localStorage.setItem("user_email", data.user.email);
                let fName = data.user.first_name || data.user.firstName || data.user.firstname || data.user.Firstname || '';
                let lName = data.user.last_name || data.user.lastName || data.user.lastname || data.user.Lastname || '';
                
                // Fallback: If separate fields are missing, try to split 'name'
                if (!fName && data.user.name) {
                    const parts = data.user.name.trim().split(' ');
                    fName = parts[0];
                    lName = parts.slice(1).join(' ');
                }
                
                localStorage.setItem("first_name", fName);
                localStorage.setItem("last_name", lName);

                const fullName = `${fName} ${lName}`.trim();
                localStorage.setItem("full_display_name", fullName || data.user.full_name || "");

                window.location.href = "dashboard.html";
            }
        } else {
            showSuccess(data.error || "Invalid Code");
        }
    } catch (e) {
        console.error("OTP Error:", e);
        showSuccess(`Verification Failed: ${e.message}`);
    } finally {
        setLoading(btn, false);
    }
});

// ===== FORGOT PASSWORD FLOW =====
async function handleForgotRequest(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    setLoading(btn, true, "Sending...");
    const email = document.getElementById("forgotEmail").value.trim();

    try {
        const res = await fetch(`${API_BASE}/forgot_password.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if(data.ok) {
            tempEmail = email;
            switchForgotStep(2);
        } else {
            showSuccess(data.error || "Error");
        }
    } catch(err) { 
        console.error("Forgot Password Error:", err);
        showSuccess("Connection Error"); 
    }
    finally { setLoading(btn, false); }
}

async function handleForgotVerify(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    setLoading(btn, true, "Verifying...");
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
    } catch(err) { showSuccess("Error"); }
    finally { setLoading(btn, false); }
}

async function handleNewPassword(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    setLoading(btn, true, "Updating...");

    const payload = {
        email: tempEmail,
        reset_token: document.getElementById("resetToken").value,
        new_password: document.getElementById("newPass").value
    };

    try {
        const res = await fetch(`${API_BASE}/reset_password.php`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(data.ok) {
            showSuccess("Updated! Please login.");
            setTimeout(() => showLogin(), 2000);
        } else {
            showSuccess(data.error || "Failed");
        }
    } catch(err) { showSuccess("Error"); }
    finally { setLoading(btn, false); }
}

function switchForgotStep(step) {
    document.querySelectorAll('[id^="forgotStep"]').forEach(el => el.classList.add("hidden"));
    document.getElementById(`forgotStep${step}`).classList.remove("hidden");
}

// ===== OTP TIMER & RESEND =====
function startOtpTimer() {
    const display = document.getElementById("otpTimerDisplay");
    const resendBtn = document.getElementById("resendOtpBtn");
    
    let duration = 600; 
    if (window.otpInterval) clearInterval(window.otpInterval);
    window.otpInterval = setInterval(() => {
        let m = Math.floor(duration / 60).toString().padStart(2, '0');
        let s = (duration % 60).toString().padStart(2, '0');
        if(display) display.innerText = `Expires in ${m}:${s}`;
        if (--duration < 0) clearInterval(window.otpInterval);
    }, 1000);

    let cooldown = 60;
    resendBtn.disabled = true;
    if (window.resendInterval) clearInterval(window.resendInterval);
    window.resendInterval = setInterval(() => {
        resendBtn.innerText = `Resend in ${--cooldown}s`;
        if (cooldown <= 0) {
            clearInterval(window.resendInterval);
            resendBtn.disabled = false;
            resendBtn.innerText = "Resend Code";
        }
    }, 1000);
}

async function sendOtpAsync(userId, purpose) {
    try {
        await fetch(`${API_BASE}/resend_otp.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, purpose: purpose })
        });
    } catch (e) { console.error(e); }
}