document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const button = e.target.querySelector('button');

    // --- HELPER FUNCTION TO CREATE A UNIQUE ID ---
    // crypto.randomUUID() ki jagah iska istemal karein
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    // -----------------------------------------

    button.disabled = true;
    button.classList.add("loading");

    // Ek unique device token banayein aur save karein
    const deviceToken = generateUUID(); // Yahan par naya function use kiya gaya hai
    localStorage.setItem('deviceToken', deviceToken);

    try {
        const res = await fetch('https://blogbackend-new.onrender.com/api/v1/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, deviceToken })
        });

        const data = await res.json();

        if (data.success) {
            alert('Password reset link sent to your email!');
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