document.addEventListener("DOMContentLoaded", () => {
  const signinForm = document.getElementById("signin-form");
  const signinButton = signinForm.querySelector("button");

  if (localStorage.getItem("token")) {
    window.location.href = "hom.html"; 
    return;
  }

  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("pass").value;

    // Button ko disable karein aur spinner dikhayein
    signinButton.disabled = true;
    signinButton.classList.add("loading");

    try {
      const response = await fetch("https://blogbackend-new-x586.onrender.com/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user)); // Store user data
        window.location.href = "hom.html";
      } else {
        alert(data.message || "Login failed!");
      }
    } catch (error) {
      alert("An error occurred during login.");
    } finally {
      // Button ko wapas normal state me laayein
      signinButton.disabled = false;
      signinButton.classList.remove("loading");
    }
  });
});
