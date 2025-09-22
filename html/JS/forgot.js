// b/frontend/html/JS/forgot.js

document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const button = e.target.querySelector('button');

    // --- REMOVE THE HELPER FUNCTION AND THE deviceToken LOGIC ---
    // function generateUUID() { ... } // DELETE THIS FUNCTION
    // const deviceToken = generateUUID(); // DELETE THIS LINE
    // localStorage.setItem('deviceToken', deviceToken); // DELETE THIS LINE
    
    button.disabled = true;
    button.classList.add("loading");

    try {
        const res = await fetch('https://blogbackend-new.onrender.com/api/v1/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Update the body to only send the email
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (data.success) {
            alert('Password reset link sent to your email!');
            // No longer need to clear localStorage here, but it's good practice
            // to clear specific temporary items if you had others.
            window.location.href = 'signin.html';
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        alert('An error occurred. Please try again.');
    } finally {
        button.disabled = false;
        button.classList.remove("loading");
    }
});
