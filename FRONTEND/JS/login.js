/* ===========================
    FRONTEND/JS/login.js
   =========================== */

const API_BASE = "http://localhost/WEBPROG_PROJ/BACKEND/API/AUTH";
let tempUserId = null;
let tempEmail = null;

// AUTO-REDIRECT: If user is already logged in, go to dashboard
document.addEventListener("DOMContentLoaded", () => {
    // If you want to stay on the login page for testing, clear your localStorage 
    // or comment out the lines below:
    // if (localStorage.getItem("user_id")) {
    //     window.location.href = "garage.html";
    // }
    
    // Add event listener for password validation message
    const signupPasswordField = document.getElementById("signupPassword");
    if (signupPasswordField) {
        signupPasswordField.addEventListener("input", function() {
            updatePasswordValidationMessage(this.value);
        });
    }
});

// ===== UI TOGGLE FUNCTIONS (User's UI Logic) =====

function switchPanel(fromId, toId) {
    const from = document.getElementById(fromId);
    const to = document.getElementById(toId);

    if (!from || !to) return;

    clearErrors();

    from.classList.add('slide-out-left');

    setTimeout(() => {
        from.classList.add('hidden');
        from.classList.remove('slide-out-left'); // Clean up
        to.classList.remove('hidden');
        to.classList.add('slide-in-right');
        setTimeout(() => to.classList.remove('slide-in-right'), 600); // Match CSS transition time
    }, 300);
}

function showSignup() {
    switchPanel('loginForm', 'signupForm');
}

function showLogin() {
    // Determine which panel is currently visible to switch back from
    const currentPanel = ['signupForm', 'otpForm', 'forgotPanel1', 'forgotPanel2', 'forgotPanel3']
        .find(id => {
            const el = document.getElementById(id);
            return el && !el.classList.contains('hidden');
        });
    
    if (currentPanel) {
        switchPanel(currentPanel, 'loginForm');
    } else {
        document.getElementById('loginForm').classList.remove('hidden');
    }
}

function showOTP(userId, purpose, email = "") {
    // If coming from signup
    const from = document.getElementById('signupForm').classList.contains('hidden') ? 'loginForm' : 'signupForm';
    switchPanel(from, 'otpForm');
    
    document.getElementById("otpUserId").value = userId;
    document.getElementById("otpPurpose").value = purpose;
    
    if (email) {
        const [name, domain] = email.split('@');
        const masked = name.length > 2 ? name[0] + '***' + name[name.length - 1] + '@' + domain : email;
        document.getElementById("otpEmailDisplay").innerText = masked;
    }
    startOtpTimer();
}

function backToSignup() {
    switchPanel('otpForm', 'signupForm');
}

function showForgot() {
    switchPanel('loginForm', 'forgotPanel1');
}

function cancelForgotFlow() {
    const currentStep = ['forgotPanel1', 'forgotPanel2', 'forgotPanel3']
        .find(id => !document.getElementById(id).classList.contains('hidden'));
    if (currentStep) switchPanel(currentStep, 'loginForm');
}

function switchForgotStep(step) {
    const prevStep = step > 1 ? `forgotPanel${step - 1}` : 'loginForm';
    switchPanel(prevStep, `forgotPanel${step}`);
}

function togglePassword(fieldId, toggleElement) {
    const field = document.getElementById(fieldId);
    const icon = toggleElement.querySelector('.eye-icon');

    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.add('active');
        icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        field.type = 'password';
        icon.classList.remove('active');
        icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
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

// ===== PASSWORD VALIDATION =====
function validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }
    
    return errors;
}

function updatePasswordValidationMessage(password) {
    const validationMsg = document.getElementById("passwordValidationMessage");
    if (!validationMsg) return;
    
    if (!password) {
        validationMsg.innerHTML = "";
        validationMsg.classList.remove("error");
        return;
    }
    
    const errors = validatePassword(password);
    
    if (errors.length === 0) {
        validationMsg.innerHTML = "";
        validationMsg.classList.remove("error");
    } else if (errors.length === 1) {
        // One requirement missing
        validationMsg.innerHTML = `One password requirement is still missing.`;
        validationMsg.classList.add("error");
    } else {
        // Multiple requirements missing - show as bullet list
        const bulletList = errors.map(error => `<li>${error}</li>`).join("");
        validationMsg.innerHTML = `<ul>${bulletList}</ul>`;
        validationMsg.classList.add("error");
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
            setTimeout(() => window.location.href = "garage.html", 500);
        } else if (data.require_verification) {
            tempUserId = data.user_id;
            tempEmail = data.email;
            await sendOtpAsync(tempUserId, 'register');
            showOTP(tempUserId, 'register', tempEmail);
        } else {
            showSuccess(data.error || "Invalid Credentials");
        }
    } catch (err) {
        showSuccess("Server connection error.");
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

    // Validate password strength
    const passwordErrors = validatePassword(payload.password);
    if (passwordErrors.length > 0) {
        setLoading(btn, false);
        return showSuccess(passwordErrors.join("\n"));
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
        showSuccess("Connection error.");
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

                window.location.href = "garage.html";
            }
        } else {
            showSuccess(data.error || "Invalid Code");
        }
    } catch (e) {
        showSuccess("Verification Error");
    } finally {
        setLoading(btn, false);
    }
});

// ===== FORGOT PASSWORD FLOW =====
document.getElementById("forgotStep1")?.addEventListener("submit", async function(e) {
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
    } catch(err) { showSuccess("Error"); }
    finally { setLoading(btn, false); }
});

document.getElementById("forgotStep2")?.addEventListener("submit", async function(e) {
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
});

document.getElementById("forgotStep3")?.addEventListener("submit", async function(e) {
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
});

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
    if (resendBtn) {
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

// Input focus animations
document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('focus', function() {
        const label = this.parentElement.parentElement.querySelector('.input-label');
        if (label) label.style.color = 'var(--racing-red)';
    });

    input.addEventListener('blur', function() {
        if (!this.value) {
            const label = this.parentElement.parentElement.querySelector('.input-label');
            if (label) label.style.color = 'var(--steel-grey)';
        }
    });
});
