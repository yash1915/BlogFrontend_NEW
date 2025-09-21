document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://blogbackend-new.onrender.com/api/v1";
    let currentUser = null;

    // --- DOM Elements ---
    const sections = {
        home: document.getElementById("home-section"),
        create: document.getElementById("create-section"),
        detail: document.getElementById("post-detail-section"),
    };
    const postsContainer = document.getElementById("posts-container");
    const createPostForm = document.getElementById("create-post-form");

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

    // --- AUTH ---
    const checkAuth = () => {
        if (!getToken()) window.location.href = "signin.html";
        else currentUser = JSON.parse(localStorage.getItem("user"));
    };
    const logout = () => {
        localStorage.clear();
        window.location.href = "signin.html";
    };

    // --- RENDER FUNCTIONS ---
    const renderPosts = (posts) => {
        postsContainer.innerHTML = "";
        posts.forEach(post => {
            const postDiv = document.createElement("div");
            postDiv.className = "post";
            postDiv.innerHTML = `
                ${post.postMedia ? `<img src="${post.postMedia}" alt="Post thumbnail" class="post-thumbnail">` : ''}
                <h3>${escapeHTML(post.title)}</h3>
                <p>by ${escapeHTML(post.author.firstName)} ${escapeHTML(post.author.lastName)}</p>
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
                    <p><strong>${escapeHTML(comment.user.firstName)} ${escapeHTML(comment.user.lastName)} ${authorTag}:</strong> ${escapeHTML(comment.body)}</p>
                    <div class="comment-actions">
                        <div class="like-container">
                            <button class="comment-like-btn small-btn ${isCommentLiked ? 'liked' : ''}" data-comment-id="${comment._id}"><i class="fa-solid fa-thumbs-up"></i> (${comment.likes.length})</button>
                            ${comment.likes.length > 0 ? `<div class="liked-by-tooltip">${commentLikedByNames}</div>` : ''}
                        </div>
                        ${!isReply ? `<button class="comment-reply-btn small-btn" data-comment-id="${comment._id}"><i class="fa-solid fa-reply"></i> Reply</button>` : ''}
                        ${isCommentAuthor ? `
                            <button class="comment-edit-btn small-btn" data-comment-id="${comment._id}" data-current-body="${escapeHTML(comment.body)}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                            <button class="comment-delete-btn small-btn" data-comment-id="${comment._id}"><i class="fa-solid fa-trash"></i> Delete</button>
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
                <p class="author-info">by ${escapeHTML(post.author.firstName)} ${escapeHTML(post.author.lastName)}</p>
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
    const loadPosts = async () => {
        showSection('home');
        try {
            const res = await fetch(`${API_URL}/posts`);
            if (!res.ok) throw new Error("Could not fetch posts.");
            const data = await res.json();
            renderPosts(data.posts);
        } catch (err) {
            console.error("Error loading posts:", err);
            alert("Error loading posts.");
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

    const handleCreatePost = async (e) => {
        e.preventDefault();
        const formData = new FormData(createPostForm);
        try {
            const res = await fetch(`${API_URL}/posts/create`, {
                method: "POST",
                headers: getAuthHeaders(true),
                body: formData
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create post");
            }
            createPostForm.reset();
            loadPosts();
        } catch(err) {
            console.error("Error creating post:", err);
            alert("Could not create post: " + err.message);
        }
    };

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
    };

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
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/toggle-like`, { method: 'POST', headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to like post");
            openPost(postId);
        } catch (err) {
            console.error("Error liking post:", err);
        }
    };

    const handleCommentSubmit = async (e, parentCommentId = null) => {
        e.preventDefault();
        const postId = e.target.closest('.post-detail-container').dataset.postId;
        const body = e.target.querySelector('textarea').value.trim();
        if (!body) return;

        try {
            const res = await fetch(`${API_URL}/comments/create`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ postId, body, parentCommentId })
            });
            if (!res.ok) throw new Error("Failed to post comment");
            openPost(postId);
        } catch (err) {
            console.error("Error submitting comment:", err);
            alert(err.message);
        }
    };

    const handleCommentLike = async (commentId) => {
        const postId = document.querySelector('.post-detail-container').dataset.postId;
        try {
            const res = await fetch(`${API_URL}/comments/${commentId}/toggle-like`, { method: 'POST', headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to like comment");
            openPost(postId);
        } catch (err) {
            console.error("Error liking comment:", err);
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
    document.getElementById("home-btn").addEventListener("click", loadPosts);
    document.getElementById("create-post-btn").addEventListener("click", () => showSection('create'));
    document.getElementById("profile-btn").addEventListener("click", () => window.location.href = "profile.html");
    document.getElementById("logout-btn").addEventListener("click", logout);
    createPostForm.addEventListener("submit", handleCreatePost);

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-post-btn')) openPost(e.target.dataset.id);
        if (e.target.id === 'back-to-home-btn') loadPosts();
        if (e.target.classList.contains('delete-post-btn')) handleDeletePost(e.target.dataset.id);
        if (e.target.classList.contains('like-post-btn')) handleLikePost(e.target.dataset.id);
        if (e.target.classList.contains('edit-post-btn')) handleEditPost(e.target.dataset.id);
        
        if (e.target.classList.contains('comment-like-btn')) handleCommentLike(e.target.dataset.commentId);
        if (e.target.classList.contains('comment-delete-btn')) handleCommentDelete(e.target.dataset.commentId);
        if (e.target.classList.contains('comment-edit-btn')) handleCommentEdit(e.target.dataset.commentId, e.target.dataset.currentBody);
        if (e.target.classList.contains('comment-reply-btn')) showReplyForm(e.target.dataset.commentId);
    });
    
    sections.detail.addEventListener('submit', (e) => {
        if (e.target.id === 'comment-form') {
            handleCommentSubmit(e);
        }
        if (e.target.classList.contains('reply-form')) {
            const commentElement = e.target.closest('.comment');
            const commentId = commentElement.querySelector('.small-btn').dataset.commentId;
            handleCommentSubmit(e, commentId);
        }
    });

    // --- INITIALIZE ---
    checkAuth();
    loadPosts();
});