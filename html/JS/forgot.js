document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const button = e.target.querySelector('button');
    
    button.disabled = true;
    button.textContent = 'Sending...';

    try {
        const res = await fetch('https://blogbackend-new.onrender.com/api/v1/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (data.success) {
            alert('Password reset link sent to your email!');
            window.location.href = 'signin.html';
        } else {
            // Error aane par button ko theek karein
            button.disabled = false;
            button.textContent = 'Send Password Reset Link';
            alert('Error: ' + data.message);
        }
    } catch (err) {
        // Kisi bhi aur error par button ko theek karein
        button.disabled = false;
        button.textContent = 'Send Password Reset Link';
        alert('An error occurred. Please try again.');
    }
    // `finally` block ki ab zaroorat nahi hai, kyunki humne logic upar handle kar liya hai.
});