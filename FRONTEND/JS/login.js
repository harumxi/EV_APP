// LOGIN LOGIC
document.getElementById('loginFormElement').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    try {
        // === ABSOLUTE URL ===
        const response = await fetch('http://localhost/WEBPROG_PROJ/BACKEND/api/auth/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.ok) {
            // Save user session
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            
            // Redirect to your Garage/Dashboard
            alert("Login Successful! Redirecting...");
            window.location.href = 'garage.html'; 
        } else {
            alert(result.error || "Login failed.");
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Cannot connect to server. Ensure XAMPP is running.");
    }
});