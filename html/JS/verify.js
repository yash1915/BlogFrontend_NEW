document.addEventListener("DOMContentLoaded", () => {
    const verifyForm = document.getElementById("verify-form");
    const API_URL = "https://blogbackend-new.onrender.com/api/v1";

    verifyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const otp = document.getElementById("otp").value.trim();
        const pendingSignup = JSON.parse(localStorage.getItem("pendingSignup"));

        if (!pendingSignup) {
            alert("Signup data not found. Please start over.");
            window.location.href = "index.html";
            return;
        }

        const finalSignupData = { ...pendingSignup, otp };

        try {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalSignupData),
            });
            const data = await res.json();

            if (data.success) {
                localStorage.removeItem("pendingSignup");
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                alert("✅ Signup successful! You are now logged in.");
                window.location.href = "hom.html";
            } else {
                alert(data.message || "❌ OTP verification failed. Please try again.");
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            alert("An error occurred.");
        }
    });
});
