document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const button = e.target.querySelector('button');

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Retrieve the device token from local storage
    const deviceToken = localStorage.getItem('deviceToken');

    if (!token) {
        alert("Invalid or missing reset token.");
        return;
    }

    if (!deviceToken) {
        alert("This link can only be used on the device where the reset request was initiated.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Disable button and show spinner
    button.disabled = true;
    button.classList.add("loading");
    
    try {
        const res = await fetch('https://blogbackend-new.onrender.com/api/v1/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Include the device token in the request body
            body: JSON.stringify({ token, password: newPassword, confirmPassword, deviceToken })
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
        // Re-enable button and hide spinner
        button.disabled = false;
        button.classList.remove("loading");
    }
});