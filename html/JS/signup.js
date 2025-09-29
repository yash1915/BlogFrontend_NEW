document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const signupButton = signupForm.querySelector("button");
  const API_URL = "https://blogbackend-new-x586.onrender.com/api/v1";

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (password !== confirmPassword) {
      alert("⚠️ Passwords do not match!");
      return;
    }

    // Disable the button and show the loading spinner
    signupButton.disabled = true;
    signupButton.classList.add("loading");

    const signupData = { firstName, lastName, email, password, confirmPassword };
    localStorage.setItem("pendingSignup", JSON.stringify(signupData));

    try {
      // Send OTP
      console.log("otpsent");
      const res = await fetch(`${API_URL}/auth/sendotp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
     
      const data = await res.json();
       console.log(data);
      if (data.success) {
        alert("✅ OTP sent to your email. Please verify.");
        window.location.href = "verify.html";
      } else {
        alert(data.message || "❌ Failed to send OTP. User may already exist.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("An error occurred. Please try again.");
    } finally {
        // Re-enable the button and hide the spinner
        signupButton.disabled = false;
        signupButton.classList.remove("loading");
    }
  });
});
