document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://blogbackend-new.onrender.com/api/v1";
    let currentUser = null;

    // --- DOM Elements ---
    const summarySection = document.getElementById("my-posts-summary-section");
    const detailSection = document.getElementById("my-posts-detail-section");
    const summaryContainer = document.getElementById("my-posts-summary-container");

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
    const escapeHTML = (str) => {
        const p = document.createElement("p");
        p.textContent = str;
        return p.innerHTML;
    };

    // --- AUTH ---
    const checkAuth = () => {
        if (!getToken()) {
            window.location.href = "signin.html";
        } else {
            currentUser = JSON.parse(localStorage.getItem("user"));
        }
    };

    // --- RENDER FUNCTIONS ---
    const renderPostSummaries = (posts) => {
        summaryContainer.innerHTML = "";
        if (posts.length === 0) {
            summaryContainer.innerHTML = "<p>You haven't created any posts yet.</p>";
            return;
        }
        posts.forEach(post => {
            const postDiv = document.createElement("div");
            postDiv.className = "post"; // Purani .post style ka istemal
            postDiv.innerHTML = `
                <h3>${escapeHTML(post.title)}</h3>
                <p>${escapeHTML(post.body.substring(0, 150))}...</p>
                <button class="view-post-details-btn" data-id="${post._id}">View Details</button>
            `;
            summaryContainer.appendChild(postDiv);
        });
    };

    const renderPostDetail = (post) => {
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
                    <div class="replies-container">${comment.replies ? comment.replies.map(reply => renderComment(reply, true)).join('') : ''}</div>
                </div>`;
        };

        detailSection.innerHTML = `
            <div class="post-detail-container" data-post-id="${post._id}">
                <button class="back-to-summary-btn back-btn">&larr; Back to My Posts</button>
                <h2>${escapeHTML(post.title)}</h2>
                ${post.postMedia ? (post.mediaType === 'video' ? `<video src="${post.postMedia}" controls class="post-media-full"></video>` : `<img src="${post.postMedia}" alt="${escapeHTML(post.title)}" class="post-media-full">`) : ''}
                <p class="post-body">${escapeHTML(post.body)}</p>
                <div class="post-actions">
                    <div class="like-container">
                        <button class="like-post-btn ${isLiked ? 'liked' : ''}" data-id="${post._id}">
                            <i class="fa-solid fa-thumbs-up"></i> (${post.likes.length})
                        </button>
                        ${post.likes.length > 0 ? `<div class="liked-by-tooltip">${likedByNames}</div>` : ''}
                    </div>
                    <button class="edit-post-btn" data-id="${post._id}">Edit</button>
                    <button class="delete-post-btn" data-id="${post._id}">Delete</button>
                </div>
                <div class="comments-section">
                    <h3>Comments</h3>
                    <form class="comment-form"><textarea placeholder="Add a comment..." required></textarea><button type="submit"><i class="fa-solid fa-comment"></i> Comment</button></form>
                    <div class="comments-container">${post.comments.map(comment => renderComment(comment)).join('')}</div>
                </div>
            </div>`;
        
        summarySection.classList.add('hidden');
        detailSection.classList.remove('hidden');
    };

    // --- API Calls ---
    const loadPostSummaries = async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_URL}/posts/user/${currentUser._id}`, { headers: getAuthHeaders(), cache: 'no-cache' });
            const data = await res.json();
            if (data.success) {
                renderPostSummaries(data.posts);
            }
        } catch (err) {
            console.error("Error loading post summaries", err);
        }
    };
    
    const openPost = async (postId) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}`, { headers: getAuthHeaders(), cache: 'no-cache' });
            const data = await res.json();
            if(data.success) {
                renderPostDetail(data.post);
            }
        } catch (err) {
            console.error("Error opening post", err);
        }
    };

    // --- Action Handler Functions ---
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
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            await fetch(`${API_URL}/posts/${postId}`, { method: 'DELETE', headers: getAuthHeaders() });
            window.location.reload();
        } catch (err) {
            alert("Could not delete post.");
        }
    };

    const handleLikePost = async (postId) => {
        try {
            await fetch(`${API_URL}/posts/${postId}/toggle-like`, { method: 'POST', headers: getAuthHeaders() });
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
            await fetch(`${API_URL}/comments/create`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ postId, body, parentCommentId })
            });
            openPost(postId);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCommentLike = async (commentId) => {
        const postId = document.querySelector('.post-detail-container').dataset.postId;
        try {
            await fetch(`${API_URL}/comments/${commentId}/toggle-like`, { method: 'POST', headers: getAuthHeaders() });
            openPost(postId);
        } catch (err) {
            console.error("Error liking comment:", err);
        }
    };

    const handleCommentDelete = async (commentId) => {
        const postId = document.querySelector('.post-detail-container').dataset.postId;
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`${API_URL}/comments/${commentId}`, { method: 'DELETE', headers: getAuthHeaders() });
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
            await fetch(`${API_URL}/comments/${commentId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ body })
            });
            openPost(postId);
        } catch (err) {
            console.error("Error updating comment:", err);
        }
    };

    const showReplyForm = (commentId) => {
        document.querySelectorAll('.reply-form-container').forEach(c => c.innerHTML = "");
        const container = document.getElementById(`reply-form-for-${commentId}`);
        container.innerHTML = `
            <form class="reply-form">
                <textarea placeholder="Write a reply..." required></textarea>
                <button type="submit">Reply</button>
            </form>
        `;
        container.querySelector('textarea').focus();
    };

    // --- EVENT LISTENERS ---
    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        if (button.classList.contains('view-post-details-btn')) openPost(button.dataset.id);
        if (button.classList.contains('back-to-summary-btn')) {
            detailSection.classList.add('hidden');
            summarySection.classList.remove('hidden');
            loadPostSummaries();
        }
        if (button.classList.contains('delete-post-btn')) handleDeletePost(button.dataset.id);
        if (button.classList.contains('like-post-btn')) handleLikePost(button.dataset.id);
        if (button.classList.contains('edit-post-btn')) handleEditPost(button.dataset.id);
        if (button.classList.contains('comment-like-btn')) handleCommentLike(button.dataset.commentId);
        if (button.classList.contains('comment-delete-btn')) handleCommentDelete(button.dataset.commentId);
        if (button.classList.contains('comment-edit-btn')) handleCommentEdit(button.dataset.commentId, button.dataset.currentBody);
        if (button.classList.contains('comment-reply-btn')) showReplyForm(button.dataset.commentId);
    });

    document.body.addEventListener('submit', (e) => {
        if (e.target.classList.contains('comment-form')) {
            e.preventDefault();
            handleCommentSubmit(e);
        }
        if (e.target.classList.contains('reply-form')) {
            e.preventDefault();
            const commentElement = e.target.closest('.comment');
            const commentId = commentElement.querySelector('.small-btn[data-comment-id]').dataset.commentId;
            handleCommentSubmit(e, commentId);
        }
    });

    // --- INITIALIZE ---
    checkAuth();
    loadPostSummaries();
});