document.addEventListener("DOMContentLoaded", () => {
    // API URLs for different parts of the backend
    const API_URL_AUTH = "https://blogbackend-new-x586.onrender.com/api/v1/auth";
    let currentUser = null;

    // DOM Element Selectors
    const profileDetails = document.getElementById("profile-details");
    const updateProfileForm = document.getElementById("update-profile-form");
    const deleteAccountForm = document.getElementById("delete-account-form");
    const aboutTextarea = document.getElementById("about");
    const myPostsBtn = document.getElementById("my-posts-btn");

    // --- UTILS ---
    const getToken = () => localStorage.getItem("token");
   const getAuthHeaders = () => {
    const headers = new Headers(); // Naya Headers object banayein
    headers.append("Authorization", `Bearer ${getToken()}`); // Sirf Authorization header add karein
    headers.append("Content-Type", "application/json"); // Content-Type header add karein
    return headers; // Poora headers object return karein
};
    
    // --- API & DOM MANIPULATION ---
    const loadProfile = async () => {
        if (!getToken()) {
            window.location.href = "signin.html";
            return;
        }
        try {
            const res = await fetch(`${API_URL_AUTH}/me`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                currentUser = data.user; // Save current user data
                profileDetails.innerHTML = `
                    <p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
                    <p><strong>Email:</strong> ${currentUser.email}</p>
                    <p><strong>About:</strong> ${currentUser.about || 'Not set'}</p>
                `;
                aboutTextarea.value = currentUser.about || '';
            } else {
                alert("Could not load profile.");
            }
        } catch (err) {
            console.error("Error loading profile", err);
        }
    };

    // --- EVENT LISTENERS ---

    // Updated Event Listener to open a new page
    myPostsBtn.addEventListener("click", () => {
        // This will open the new my-posts.html page in a new tab.
        window.location.href = "my-posts.html"; // Same tab me kholega
    });

    updateProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const about = aboutTextarea.value;
        try {
            const res = await fetch(`${API_URL_AUTH}/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ about })
            });
            const data = await res.json();
            if (data.success){
                alert("Profile updated!");
                loadProfile();
            } else {
                alert("Failed to update profile: " + data.message);
            }
        } catch(err) {
            console.error("Error updating profile", err);
        }
    });

    deleteAccountForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.getElementById("password").value;
        if (!confirm("Are you absolutely sure you want to delete your account? This cannot be undone.")) {
            return;
        }
        try {
             const res = await fetch(`${API_URL_AUTH}/account`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.success) {
                alert("Account deleted successfully.");
                localStorage.clear();
                window.location.href = "index.html";
            } else {
                alert("Failed to delete account: " + data.message);
            }
        } catch(err) {
            console.error("Error deleting account", err);
        }
    });
    
    document.getElementById("logout-btn").addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'signin.html';
    });
    
    // --- INITIALIZE ---
    loadProfile();
});
