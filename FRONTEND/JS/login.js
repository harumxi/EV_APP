// Toggle to Signup
window.showSignup = function() {
    const login = document.getElementById('loginForm');
    const signup = document.getElementById('signupForm');
    
    if (login && signup) {
        login.classList.add('hidden');
        signup.classList.remove('hidden');
        console.log("Switched to Signup");
    } else {
        console.error("Could not find form elements. Check IDs.");
    }
};

// Toggle to Login
window.showLogin = function() {
    const login = document.getElementById('loginForm');
    const signup = document.getElementById('signupForm');
    
    if (login && signup) {
        signup.classList.add('hidden');
        login.classList.remove('hidden');
        console.log("Switched to Login");
    }
};

// STRICT Password Check for signup
const strictPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!strictPass.test(pass)) {
        alert("Password must be 8+ chars, with an uppercase, number, and special character.");
        return;
    }
    if (pass !== confirm) {
        alert("Passwords do not match.");
        return;
    }

    // Backend fetch logic here...
    alert("Validation passed. Ready to create account.");
});