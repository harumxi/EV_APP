// Toggle between Login and Signup
function showSignup() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    clearErrors();
    
    loginForm.classList.add('slide-out-left');
    
    setTimeout(() => {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        signupForm.classList.remove('slide-out-left');
        signupForm.classList.add('slide-in-right');
    }, 300);
}

function showLogin() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    clearErrors();
    
    signupForm.classList.add('slide-out-left');
    
    setTimeout(() => {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        loginForm.classList.remove('slide-out-left');
        loginForm.classList.add('slide-in-right');
    }, 300);
}

// Toggle password visibility
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

// Clear all error messages
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
    });
}

// Show success message
function showSuccess(message) {
    const successMsg = document.getElementById('successMessage');
    successMsg.textContent = message;
    successMsg.classList.add('show');
    
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 3000);
}

// Handle Login form submission
document.getElementById('loginFormElement').addEventListener('submit', function(e) {
    e.preventDefault();
    clearErrors();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!password) {
        document.getElementById('loginPasswordError').classList.add('show');
        return;
    }
    
    // Store user data in localStorage
    const userData = {
        email: email,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    console.log('Login:', { email, password });
    
    // Immediate redirect to garage page
    window.location.href = 'garage.html';
});

// Handle Signup form submission
document.getElementById('signupFormElement').addEventListener('submit', function(e) {
    e.preventDefault();
    clearErrors();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    let hasError = false;
    
    if (!name) {
        document.getElementById('signupNameError').classList.add('show');
        hasError = true;
    }
    
    if (!email || !email.includes('@')) {
        document.getElementById('signupEmailError').classList.add('show');
        hasError = true;
    }
    
    if (password.length < 6) {
        document.getElementById('signupPasswordError').classList.add('show');
        hasError = true;
    }
    
    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').classList.add('show');
        hasError = true;
    }
    
    if (hasError) return;
    
    // Store user data
    const userData = {
        name: name,
        email: email,
        signupTime: new Date().toISOString()
    };
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    console.log('Signup:', { name, email, password });
    
    // Immediate redirect to garage page
    window.location.href = 'garage.html';
});

// Handle Forgot Password
function handleForgotPassword() {
    const email = document.getElementById('loginEmail').value;
    if (email) {
        showSuccess(`Password reset link sent to ${email}`);
    } else {
        showSuccess('Please enter your email address first');
    }
}

// Add input focus animations
document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.parentElement.querySelector('.input-label').style.color = 'var(--racing-red)';
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.parentElement.querySelector('.input-label').style.color = 'var(--steel-grey)';
        }
    });
});