document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://blogbackend-new.onrender.com/api/v1";
    let currentUser = null;
     // ---  NEW VARIABLES ---
    let currentPage = 1;
    let isLoading = false;
    let hasMorePosts = true;
    // --- BUTTON HELPER ---(ye function sabse niche use hua hai)
const handleAsyncClick = async (button, asyncFunction) => {
    if (!button || button.disabled) return;

    const originalText = button.textContent;
    button.disabled = true;
    // Hum "Loading..." text sirf specific buttons par dikhayenge
    if (button.classList.contains('view-post-btn') || button.classList.contains('delete-post-btn')) {
        button.textContent = 'Loading...';
    }

    try {
        await asyncFunction(); // Aapka main kaam yahan hoga
    } catch (error) {
        console.error("An error occurred during the async operation:", error);
        // User ko error dikhana zaroori hai
        alert("An operation could not be completed. Please try again.");
    } finally {
        // Kuch buttons (jaise delete) page ko reload kar dete hain,
        // isliye unhe re-enable karne ki zaroorat nahin padti.
        // Hum check karenge ki button abhi bhi page par hai ya nahin.
        if (document.body.contains(button)) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
};

    // --- DOM Elements ---
    const sections = {
        home: document.getElementById("home-section"),
        create: document.getElementById("create-section"),
        detail: document.getElementById("post-detail-section"),
    };
    const postsContainer = document.getElementById("posts-container");
    const createPostForm = document.getElementById("create-post-form");
    const createPostButton = createPostForm.querySelector("button");

    // --- UTILS ---
    const getToken = () => localStorage.getItem("token");
    const getAuthHeaders = (isFormData = false) => {
        const headers = new Headers();
        headers.append("Authorization", `Bearer ${getToken()}`);
        if (!isFormData) {
            headers.append("Content-Type", "application/json");
        }
        return headers;
    };
    const showSection = (sectionName) => {
        Object.values(sections).forEach(s => s.classList.add("hidden"));
        sections[sectionName].classList.remove("hidden");
    };
    const escapeHTML = (str) => {
        const p = document.createElement("p");
        p.textContent = str;
        return p.innerHTML;
    };
    //  HELPER FUNCTION TO FORMAT THE DATE
const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);
    // If the time difference is negative or very small, show "just now"
    if (seconds < 5) {
        return "just now";
    }

    let interval = seconds / 31536000; // Years
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000; // Months
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400; // Days
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600; // Hours
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60; // Minutes
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
};

    // --- AUTH ---
    const checkAuth = () => {
        if (!getToken()) window.location.href = "signin.html";
        else currentUser = JSON.parse(localStorage.getItem("user"));
    };
    const logout = () => {
        localStorage.clear();
        window.location.href = "signin.html";
    };

    // --- RENDER FUNCTIONS --

const renderPosts = (posts, append = false) => { 
    if (!append) { // If it's the first page, clear the container
        postsContainer.innerHTML = "";
    }
    posts.forEach(post => {
        const postDiv = document.createElement("div");
        postDiv.className = "post";
        postDiv.innerHTML = `
            ${post.postMedia ? `<img src="${post.postMedia}" alt="Post thumbnail" class="post-thumbnail">` : ''}
            <h3>${escapeHTML(post.title)}</h3>
            <p>by ${escapeHTML(post.author.firstName)} ${escapeHTML(post.author.lastName)} <span class="post-date">· ${timeAgo(post.createdAt)}</span></p>
            <p>${escapeHTML(post.body.substring(0, 150))}...</p>
            <button class="view-post-btn" data-id="${post._id}">View Details</button>
        `;
        postsContainer.appendChild(postDiv);
    });
};
    const renderPostDetail = (post) => {
        const isAuthor = post.author._id === currentUser._id;
        const isLiked = post.likes.some(like => like._id === currentUser._id);
        const likedByNames = post.likes.map(user => `${user.firstName} ${user.lastName}`).join('\n');

        const renderComment = (comment, isReply = false) => {
            const isCommentAuthor = comment.user._id === currentUser._id;
            const isPostAuthorComment = comment.user._id === post.author._id;
            const isCommentLiked = comment.likes.some(like => like._id === currentUser._id);
            const commentLikedByNames = comment.likes.map(user => `${user.firstName} ${user.lastName}`).join('\n');
            const authorTag = isPostAuthorComment ? `<span class="owner-tag">(Author)</span>` : '';

            return `
                <div class="comment ${isReply ? 'reply' : ''} ${isPostAuthorComment ? 'owner-comment' : ''}">
                    <div class="comment-header">
                <strong>${escapeHTML(comment.user.firstName)} ${escapeHTML(comment.user.lastName)} ${authorTag}</strong>
                <span class="comment-date">· ${timeAgo(comment.createdAt)}</span>
            </div>
            <p>${escapeHTML(comment.body)}</p>
                    <div class="comment-actions">
                        <div class="like-container">
                            <button class="comment-like-btn small-btn ${isCommentLiked ? 'liked' : ''}" data-comment-id="${comment._id}"><i class="fa-solid fa-thumbs-up"></i> (${comment.likes.length})</button>
                            ${comment.likes.length > 0 ? `<div class="liked-by-tooltip">${commentLikedByNames}</div>` : ''}
                        </div>
                        ${!isReply ? `<button class="comment-reply-btn small-btn" data-comment-id="${comment._id}"><i class="fa-solid fa-reply"></i> Reply</button>` : ''}
                        ${isCommentAuthor ? `
                            <button class="comment-edit-btn small-btn" data-comment-id="${comment._id}" data-current-body="${escapeHTML(comment.body)}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                            <button class="comment-delete-btn small-btn" data-comment-id="${comment._id}"><i class="fa-solid fa-trash"></i></button>
                        ` : ''}
                    </div>
                    <div class="reply-form-container" id="reply-form-for-${comment._id}"></div>
                    <div class="replies-container">
                        ${comment.replies ? comment.replies.map(reply => renderComment(reply, true)).join('') : ''}
                    </div>
                </div>
            `;
        };

        sections.detail.innerHTML = `
            <div class="post-detail-container" data-post-id="${post._id}">
                <button id="back-to-home-btn" class="back-btn">&larr; Back to Home</button>
                <h2>${escapeHTML(post.title)}</h2>
                <p class="author-info">by ${escapeHTML(post.author.firstName)} ${escapeHTML(post.author.lastName)}
                <span class="post-date">·Published on ${timeAgo(post.createdAt)}</span></p>
                ${post.postMedia ? (post.mediaType === 'video' ? `<video src="${post.postMedia}" controls class="post-media-full"></video>` : `<img src="${post.postMedia}" alt="${escapeHTML(post.title)}" class="post-media-full">`) : ''}
                <p class="post-body">${escapeHTML(post.body)}</p>
                <div class="post-actions">
                    <div class="like-container"><button class="like-post-btn ${isLiked ? 'liked' : ''}" data-id="${post._id}"><i class="fa-solid fa-thumbs-up"></i> (${post.likes.length})</button>${post.likes.length > 0 ? `<div class="liked-by-tooltip">${likedByNames}</div>` : ''}</div>
                    ${isAuthor ? `<button class="edit-post-btn" data-id="${post._id}">Edit</button><button class="delete-post-btn" data-id="${post._id}">Delete</button>` : ''}
                </div>
                <div class="comments-section">
                    <h3>Comments</h3>
                    <form id="comment-form" data-post-id="${post._id}"><textarea id="comment-body" placeholder="Add a comment..." required></textarea><button type="submit"><i class="fa-solid fa-comment"></i> Comment</button></form>
                    <div id="comments-container">${post.comments.map(comment => renderComment(comment)).join('')}</div>
                </div>
            </div>
        `;
        showSection('detail');
    };

    // --- API & DOM MANIPULATION ---
   const loadPosts = async (page = 1) => {
    // Prevent multiple requests while one is already in progress or if there are no more posts
    if (isLoading || (!hasMorePosts && page > 1)) return;
    
    isLoading = true;
    if(page === 1) {
        showSection('home');
    }
    // You can add a loading spinner indicator here if you like

    try {
        // Fetch posts for a specific page. The backend now supports this.
        const res = await fetch(`${API_URL}/posts?page=${page}&limit=10`);
        if (!res.ok) throw new Error("Could not fetch posts.");
        
        const data = await res.json();
        
        // Render the posts, appending them if it's not the first page
        renderPosts(data.posts, page > 1);

        // Update the state based on the response from the server
        currentPage = data.currentPage;
        if (currentPage >= data.totalPages) {
            hasMorePosts = false;
            // You could display a "No more posts" message to the user here
        }

    } catch (err) {
        console.error("Error loading posts:", err);
        alert("Error loading posts.");
    } finally {
        isLoading = false;
        // Hide the loading spinner indicator here
    }
};
    const openPost = async (postId) => {
        
        try {
            const res = await fetch(`${API_URL}/posts/${postId}`);
            if (!res.ok) throw new Error("Could not fetch post details.");
            const data = await res.json();
            renderPostDetail(data.post);
        } catch (err) {
            console.error("Error opening post:", err);
            alert("Error opening post.");
        }
    };

    // b/frontend/html/JS/script.js

const handleCreatePost = (e) => {
    e.preventDefault();
    const formData = new FormData(createPostForm);
    const createButton = createPostForm.querySelector('button');

    // Select the progress bar elements from your HTML
    const progressBarContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    
    // Use XMLHttpRequest (XHR) because it supports upload progress events
    const xhr = new XMLHttpRequest();
    
    xhr.open("POST", `${API_URL}/posts/create`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);

    // This event listener updates the progress bar as the file uploads
    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            progressBarContainer.classList.remove('hidden'); // Show the progress bar
            progressBar.style.width = percentComplete + '%';
            progressBar.textContent = percentComplete + '%';
        }
    };

    // This runs when the upload is complete (whether it succeeded or failed)
    xhr.onload = () => {
        // Re-enable the button and hide/reset the progress bar
        createButton.disabled = false;
        createButton.classList.remove("loading");
        progressBarContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';

        if (xhr.status >= 200 && xhr.status < 300) {
            // If the upload was successful
            createPostForm.reset();
            hasMorePosts = true; // Reset pagination state
            loadPosts(1);      // Reload posts to see the new one
        } else {
            // If the server returned an error
            const errorData = JSON.parse(xhr.responseText);
            alert("Could not create post: " + (errorData.error || "Server error"));
        }
    };

    // This handles network errors (e.g., no internet connection)
    xhr.onerror = () => {
        alert("An error occurred during the upload. Please check your network connection.");
        createButton.disabled = false;
        createButton.classList.remove("loading");
        progressBarContainer.classList.add('hidden');
    };

    // Disable the button before sending the request
    createButton.disabled = true;
    createButton.classList.add("loading");
    xhr.send(formData);
};

// Also, make sure your form's submit event listener calls this function directly
createPostForm.addEventListener("submit", handleCreatePost);
    const handleEditPost = (postId) => {
        
        const newTitle = prompt("Enter the new title:");
        const newBody = prompt("Enter the new body:");
        if (newTitle === null || newBody === null) return;
        updatePost(postId, newTitle, newBody);
    };

    const updatePost = async (postId, title, body) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ title, body })
            });
            if (!res.ok) throw new Error("Failed to update post");
            openPost(postId);
        } catch (err) {
            console.error("Error updating post:", err);
            alert("Could not update post.");
        } 
    }

    const handleDeletePost = async (postId) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`${API_URL}/posts/${postId}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to delete post");
            loadPosts();
        } catch (err) {
            console.error("Error deleting post:", err);
            alert("Could not delete post.");
        }
    };

   const handleLikePost = async (postId) => {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const likeButton = postElement.querySelector(`.like-post-btn[data-id="${postId}"]`);
    const likeContainer = likeButton.closest('.like-container');

    if (likeButton.disabled) return;
    likeButton.disabled = true;

    // UI ko turant update karein (for speed)
    const isLikedNow = likeButton.classList.toggle('liked');
    const countSpan = likeButton.querySelector('i').nextSibling;
    let currentCount = parseInt(countSpan.textContent.trim().replace('(', '').replace(')', ''));
    countSpan.textContent = ` (${isLikedNow ? currentCount + 1 : currentCount - 1})`;

    try {
        const res = await fetch(`${API_URL}/posts/${postId}/toggle-like`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Server error");
        
        const data = await res.json();
        const updatedLikes = data.post.likes; // Server se updated list

        // Tooltip ko server ke data se theek karein
        let tooltip = likeContainer.querySelector('.liked-by-tooltip');
        
        if (updatedLikes.length > 0) {
            const likedByNames = updatedLikes.map(user => `${user.firstName} ${user.lastName}`).join('\n');
            if (!tooltip) {
                // Agar tooltip nahin hai, to banayein
                tooltip = document.createElement('div');
                tooltip.className = 'liked-by-tooltip';
                likeContainer.appendChild(tooltip);
            }
            tooltip.textContent = likedByNames;
        } else {
            // Agar likes 0 hain, to tooltip हटा dein
            if (tooltip) {
                tooltip.remove();
            }
        }
        // Count ko bhi server ke data se sync karein
        countSpan.textContent = ` (${updatedLikes.length})`;

    } catch (err) {
        console.error("Error liking post:", err);
        // Error aane par, post ko dobara render karein taaki sab theek ho jaye
        openPost(postId); 
    } finally {
        likeButton.disabled = false;
    }
};
   const handleCommentSubmit = async (e, parentCommentId = null) => {
    const form = e.target;
    const body = form.querySelector('textarea').value.trim();

    if (!body) {
        // Helper function ko batayein ki aage nahin badhna hai
        throw new Error("Comment body cannot be empty.");
    }

    const postId = form.closest('.post-detail-container').dataset.postId;

    const res = await fetch(`${API_URL}/comments/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ postId, body, parentCommentId })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to post comment");
    }

    // Safal hone par post ko dobara load karein
    await openPost(postId);
};
   const handleCommentLike = async (commentId) => {
    const likeButton = document.querySelector(`.comment-like-btn[data-comment-id="${commentId}"]`);
    const likeContainer = likeButton.closest('.like-container');

    if (likeButton.disabled) return;
    likeButton.disabled = true;
    
    // UI ko turant update karein (for speed)
    const isLikedNow = likeButton.classList.toggle('liked');
    const countSpan = likeButton.querySelector('i').nextSibling;
    let currentCount = parseInt(countSpan.textContent.trim().replace('(', '').replace(')', ''));
    countSpan.textContent = ` (${isLikedNow ? currentCount + 1 : currentCount - 1})`;
    
    const postId = document.querySelector('.post-detail-container').dataset.postId;

    try {
        const res = await fetch(`${API_URL}/comments/${commentId}/toggle-like`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        if (!res.ok) throw new Error("Server error");
        
        // Server se confirmation ke baad, poore post ko re-render karein
        // Yeh comment tooltip ko theek kar dega
        openPost(postId);

    } catch (err) {
        console.error("Error liking comment:", err);
        openPost(postId);
    } finally {
        likeButton.disabled = false;
    }
};
      const handleCommentDelete = async (commentId) => {
        if (!confirm("Are you sure?")) return;
        const postId = document.querySelector('.post-detail-container').dataset.postId;
        try {
            const res = await fetch(`${API_URL}/comments/${commentId}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to delete comment");
            openPost(postId);
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };

    const handleCommentEdit = (commentId, currentBody) => {
        const newBody = prompt("Edit your comment:", currentBody);
        if (newBody === null || newBody.trim() === "") return;
        updateComment(commentId, newBody.trim());
    };

    const updateComment = async (commentId, body) => {
        const postId = document.querySelector('.post-detail-container').dataset.postId;
        try {
            const res = await fetch(`${API_URL}/comments/${commentId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ body })
            });
            if (!res.ok) throw new Error("Failed to update comment");
            openPost(postId);
        } catch (err) {
            console.error("Error updating comment:", err);
        }finally {
    }
    };

    const showReplyForm = (commentId) => {
        document.querySelectorAll('.reply-form-container').forEach(container => {
            if (container.id !== `reply-form-for-${commentId}`) {
                container.innerHTML = "";
            }
        });
        const container = document.getElementById(`reply-form-for-${commentId}`);
        if (container.innerHTML !== "") {
            container.innerHTML = "";
            return;
        }
        container.innerHTML = `
            <form class="reply-form">
                <textarea placeholder="Write a reply..." required></textarea>
                <button type="submit">Reply</button>
            </form>
        `;
        container.querySelector('textarea').focus();
    };
    
   

   // --- EVENT LISTENERS ---

// Home Button
document.getElementById("home-btn").addEventListener("click", (e) => {
    handleAsyncClick(e.target, loadPosts);
});

// Create Post Button (Yeh sirf section badalta hai, isliye helper ki zaroorat nahin)
document.getElementById("create-post-btn").addEventListener("click", () => {
    showSection('create');
});

// Profile Button (Yeh page navigate karta hai, isliye helper ki zaroorat nahin)
document.getElementById("profile-btn").addEventListener("click", () => {
    window.location.href = "profile.html";
});

// Logout Button (Yeh bhi page navigate karta hai)
document.getElementById("logout-btn").addEventListener("click", logout);

// Create Post Form Submission
createPostForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const submitButton = createPostForm.querySelector('button');
    
    // Yahan hum helper function ka istemal kar rahe hain
    handleAsyncClick(submitButton, () => handleCreatePost(e));
});

    document.body.addEventListener('click', (e) => {
             const button = e.target.closest('button'); // Clicked element ya uske parent button ko dhoondein
    if (!button) return; // Agar button par click nahin hua to kuch na karein

    // View Details Button
    if (button.classList.contains('view-post-btn')) {
        handleAsyncClick(button, () => openPost(button.dataset.id));
    }
    // Back to Home Button
    if (button.id === 'back-to-home-btn') {
        handleAsyncClick(button, loadPosts);
    }
    // Delete Post Button
    if (button.classList.contains('delete-post-btn')) {
        // Iske andar confirm() hai, isliye iska logic thoda alag hai
        handleAsyncClick(button, () => handleDeletePost(button.dataset.id));
    }
    // Like Post Button (Iska apna alag logic hai, use waise hi rehne dein)
    if (button.classList.contains('like-post-btn')) {
        handleLikePost(button.dataset.id);
    }
    // Edit Post Button
    if (button.classList.contains('edit-post-btn')) {
        // prompt() UI ko block karta hai, isliye is par helper ki zaroorat nahin
        handleEditPost(button.dataset.id);
    }
    // Comment Like Button (Iska bhi apna alag logic hai)
    if (button.classList.contains('comment-like-btn')) {
        handleCommentLike(button.dataset.commentId);
    }
    // Delete Comment Button
    if (button.classList.contains('comment-delete-btn')) {
        handleAsyncClick(button, () => handleCommentDelete(button.dataset.commentId));
    }
    // Edit Comment Button
    if (button.classList.contains('comment-edit-btn')) {
        // prompt() UI ko block karta hai, isliye is par helper ki zaroorat nahin
        handleCommentEdit(button.dataset.commentId, button.dataset.currentBody);
    }
    // Reply Button (Yeh UI change karta hai, API call nahin)
    if (button.classList.contains('comment-reply-btn')) {
        showReplyForm(button.dataset.commentId);
    }
    window.addEventListener('scroll', () => {
    // Check if the user has scrolled to the bottom of the page
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200) {
        if (hasMorePosts && !isLoading) {
            loadPosts(currentPage + 1); // Load the next page
        }
    }
});


        // Desktop par Like ke liye click event
        if (window.innerWidth > 768) {
            const likeBtn = e.target.closest('.like-post-btn');
            if (likeBtn) handleLikePost(likeBtn.dataset.id);

            const commentLikeBtn = e.target.closest('.comment-like-btn');
            if (commentLikeBtn) handleCommentLike(commentLikeBtn.dataset.commentId);
        }
    });

    // === MOBILE TOUCH EVENTS FOR LIKE BUTTON ===
    let pressTimer;
    let isLongPress = false;

    document.body.addEventListener('touchstart', (e) => {
        const likeContainer = e.target.closest('.like-container');
        if (!likeContainer) return;

        isLongPress = false;
        pressTimer = window.setTimeout(() => {
            isLongPress = true;
            likeContainer.classList.add('show-tooltip');
        }, 500); // 0.5 second hold
    }, { passive: true });

    document.body.addEventListener('touchend', (e) => {
        const likeContainer = e.target.closest('.like-container');
        if (!likeContainer) return;
        
        clearTimeout(pressTimer);
        
        if (isLongPress) {
            setTimeout(() => {
                likeContainer.classList.remove('show-tooltip');
            }, 1500);
        } else {
            const likeButton = likeContainer.querySelector('.like-post-btn, .comment-like-btn');
            if (likeButton.classList.contains('like-post-btn')) {
                handleLikePost(likeButton.dataset.id);
            } else {
                handleCommentLike(likeButton.dataset.commentId);
            }
        }
    });
    
   sections.detail.addEventListener('submit', (e) => {
    const form = e.target;

    // Top-level comments ke liye
    if (form.id === 'comment-form') {
        e.preventDefault(); // Form ko submit hone se rokein
        const button = form.querySelector('button');
        // Helper function ka istemal karein
        handleAsyncClick(button, () => handleCommentSubmit(e));
    }

    // Replies ke liye
    if (form.classList.contains('reply-form')) {
        e.preventDefault(); // Form ko submit hone se rokein
        const button = form.querySelector('button');
        const commentId = form.closest('.comment').querySelector('[data-comment-id]').dataset.commentId;
        // Helper function ka istemal karein
        handleAsyncClick(button, () => handleCommentSubmit(e, commentId));
    }
});


    // --- INITIALIZE ---
    checkAuth();
    loadPosts();
});
