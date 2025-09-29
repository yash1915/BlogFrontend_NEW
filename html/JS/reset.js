// b/frontend/html/JS/reset.js

document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const button = e.target.querySelector('button');

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // --- REMOVE THE deviceToken LOGIC ---
    // const deviceToken = localStorage.getItem('deviceToken'); // DELETE THIS LINE

    if (!token) {
        alert("Invalid or missing reset token.");
        return;
    }

    // --- DELETE THIS ENTIRE "if" BLOCK ---
    // if (!deviceToken) {
    //     alert("This link can only be used on the device where the reset request was initiated.");
    //     return;
    // }

    if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    button.disabled = true;
    button.classList.add("loading");
    
    try {
        const res = await fetch('https://blogbackend-new-x586.onrender.com/api/v1/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Update the body to remove deviceToken
            body: JSON.stringify({ token, password: newPassword, confirmPassword })
        });
        const data = await res.json();
        if(data.success) {
            alert('Password has been reset successfully! Please log in again.');
            localStorage.clear(); 
            window.location.href = 'signin.html';
        } else {
            alert('Error: ' + data.message);
        }
    } catch(err) {
        alert('An error occurred.');
    } finally {
        button.disabled = false;
        button.classList.remove("loading");
    }
});
