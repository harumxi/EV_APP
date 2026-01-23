document.addEventListener("DOMContentLoaded", () => {
    // 1. Retrieve the fresh data saved during login
    let fullName = localStorage.getItem("full_display_name");
    const firstName = localStorage.getItem("first_name");
    const lastName = localStorage.getItem("last_name");

    if (firstName || lastName) {
        fullName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    const userEmail = localStorage.getItem("user_email");
    const username = localStorage.getItem("user_name");

    // 2. Select the UI elements by their IDs
    const nameHeader = document.getElementById('profile-name-header'); // Large name at top
    const fullNameInput = document.getElementById('full-name-input');  // Full Name input field
    const emailInput = document.getElementById('email-display-input'); // Email input field
    const handleDisplay = document.getElementById('username-handle');  // The @username handle

    // 3. Populate the UI - this fixes the "undefined" text
    if (fullName && fullName !== "User" && fullName !== "undefined") {
        if (nameHeader) nameHeader.innerText = fullName;
        if (fullNameInput) fullNameInput.value = fullName;
    } else if (username) {
        if (nameHeader) nameHeader.innerText = `@${username}`;
    }
    
    if (userEmail && userEmail !== "undefined") {
        if (emailInput) emailInput.value = userEmail;
    }

    if (username && handleDisplay) {
        handleDisplay.innerText = `@${username}`;
    }
});