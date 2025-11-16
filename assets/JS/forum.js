// forum.js - Complete Forum with AWS Cognito & MongoDB Integration

// Configuration - UPDATE THESE WITH YOUR VALUES
const CONFIG = {
  cognitoDomain: 'us-east-1e2dhvuiye.auth.us-east-1.amazoncognito.com',
  clientId: '52g34e69k6uu3iddbvpdf8c0ab',
  redirectUri: window.location.origin + '/index.html',
  apiBaseUrl: 'http://localhost:3000/api' // Change to your AWS backend URL when deployed
};

// State management
let allPosts = [];
let postTags = [];
let sortType = 'hot';
let filterTopic = 'all';
let searchTerm = '';
let currentUser = null;
let authToken = null;

// ==================== Authentication Functions ====================

function getAuthTokenFromUrl() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get('id_token');
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
}

function initAuth() {
  // Check if we have a token in URL (returned from Cognito)
  const token = getAuthTokenFromUrl();
  
  if (token) {
    authToken = token;
    localStorage.setItem('authToken', token);
    currentUser = parseJwt(token);
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUIForAuthState();
    loadPosts();
  } else {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      const decoded = parseJwt(storedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        authToken = storedToken;
        currentUser = decoded;
        updateUIForAuthState();
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }
}

function updateUIForAuthState() {
  const signInBtn = document.getElementById('signInBtn');
  
  if (currentUser) {
    const userName = currentUser.name || currentUser.email?.split('@')[0] || 'User';
    signInBtn.textContent = userName;
    signInBtn.onclick = showUserMenu;
    
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
      userIcon.textContent = userName.charAt(0).toUpperCase();
    }
  } else {
    signInBtn.textContent = 'Sign In';
    signInBtn.onclick = signInWithGoogle;
  }
}

function signInWithGoogle() {
  const authUrl = `https://${CONFIG.cognitoDomain}/oauth2/authorize?` +
    `client_id=${CONFIG.clientId}&` +
    `response_type=token&` +
    `scope=email+openid+profile&` +
    `redirect_uri=${encodeURIComponent(CONFIG.redirectUri)}&` +
    `identity_provider=Google`;
  
  console.log('Redirecting to:', authUrl);
  window.location.href = authUrl;
}

function signOut() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  
  const logoutUrl = `https://${CONFIG.cognitoDomain}/logout?` +
    `client_id=${CONFIG.clientId}&` +
    `logout_uri=${encodeURIComponent(CONFIG.redirectUri)}`;
  
  window.location.href = logoutUrl;
}

function showUserMenu() {
  const menu = confirm('Sign out?');
  if (menu) {
    signOut();
  }
}

// ==================== API Functions ====================

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    console.log(`API Request: ${CONFIG.apiBaseUrl}${endpoint}`);
    const response = await fetch(`${CONFIG.apiBaseUrl}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

async function loadPosts() {
  try {
    const queryParams = new URLSearchParams();
    if (filterTopic !== 'all') queryParams.append('category', filterTopic);
    if (searchTerm) queryParams.append('search', searchTerm);
    queryParams.append('sort', sortType);
    
    const posts = await apiRequest(`/posts?${queryParams.toString()}`);
    allPosts = posts.map(post => ({
      id: post._id,
      category: post.category || 'general',
      author: post.userName || 'Anonymous',
      verified: post.verified || false,
      time: formatTime(post.createdAt),
      title: post.title,
      content: post.content,
      tags: post.tags || [],
      votes: post.votes || 0,
      comments: post.comments || 0,
      userVote: post.userVote || 0
    }));
    
    displayPosts();
  } catch (error) {
    console.error('Error loading posts:', error);
    allPosts = [];
    displayPosts();
  }
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

function displayPosts() {
  const area = document.getElementById('postsArea');
  
  if (allPosts.length === 0) {
    area.innerHTML = '<div class="no-results">No posts found. Be the first to create one!</div>';
    return;
  }

  area.innerHTML = allPosts.map(post => `
    <div class="post">
      <div class="vote-section">
        <button class="vote-btn up ${post.userVote === 1 ? 'active' : ''}" onclick="handleVote('${post.id}', 1)">▲</button>
        <div class="vote-score">${post.votes}</div>
        <button class="vote-btn down ${post.userVote === -1 ? 'active' : ''}" onclick="handleVote('${post.id}', -1)">▼</button>
      </div>
      <div class="post-main">
        <div class="post-header">
          <span class="topic-badge ${post.category}">${post.category}</span>
          <span class="author-name">u/${escapeHtml(post.author)}</span>
          ${post.verified ? '<span class="verified-icon">✓</span>' : ''}
          <span>•</span>
          <span>${post.time}</span>
        </div>
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <p class="post-desc">${escapeHtml(post.content)}</p>
        ${post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="post-tag" onclick="searchByTag('${escapeHtml(tag)}')">#${escapeHtml(tag)}</span>`).join('')}
          </div>
        ` : ''}
        <div class="post-footer">
          <div class="post-btn">💬 ${post.comments} Comments</div>
          <div class="post-btn">🔗 Share</div>
          <div class="post-btn">⭐ Save</div>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function handleVote(postId, dir) {
  if (!authToken) {
    alert('Please sign in to vote');
    signInWithGoogle();
    return;
  }
  
  try {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    
    let newVote = dir;
    if (post.userVote === dir) {
      newVote = 0;
    }
    
    const result = await apiRequest(`/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote: newVote })
    });
    
    post.votes = result.votes;
    post.userVote = result.userVote;
    displayPosts();
  } catch (error) {
    alert('Error voting: ' + error.message);
  }
}

// ==================== Modal Functions ====================

function openModal() {
  if (!authToken) {
    alert('Please sign in to create a post');
    signInWithGoogle();
    return;
  }
  document.getElementById('postModal').classList.add('show');
}

function closeModal() {
  document.getElementById('postModal').classList.remove('show');
  document.getElementById('titleInput').value = '';
  document.getElementById('contentInput').value = '';
  postTags = [];
  showTags();
}

function showTags() {
  const area = document.getElementById('tagsArea');
  area.innerHTML = postTags.map((tag, idx) => `
    <div class="tag-pill">
      ${escapeHtml(tag)}
      <button class="btn-remove-tag" onclick="deleteTag(${idx})">×</button>
    </div>
  `).join('');
}

function deleteTag(idx) {
  postTags.splice(idx, 1);
  showTags();
}

function searchByTag(tag) {
  searchTerm = tag;
  document.getElementById('searchInput').value = tag;
  loadPosts();
}

async function submitPost() {
  const title = document.getElementById('titleInput').value.trim();
  const content = document.getElementById('contentInput').value.trim();
  const category = document.getElementById('topicSelect').value;

  if (!title) {
    alert('Please enter a title for your post');
    return;
  }

  if (!content) {
    alert('Please enter some content for your post');
    return;
  }

  try {
    await apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify({
        category,
        title,
        content,
        tags: postTags
      })
    });

    closeModal();
    alert('Your post has been published successfully!');
    loadPosts();
  } catch (error) {
    alert('Error creating post: ' + error.message);
  }
}

// ==================== Initialize ====================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Forum initialized');
  console.log('Config:', CONFIG);
  
  // Initialize authentication
  initAuth();
  
  // Load posts
  loadPosts();
  
  // Modal controls
  document.getElementById('openModalBtn').addEventListener('click', openModal);
  document.getElementById('createWidget').addEventListener('click', openModal);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelPostBtn').addEventListener('click', closeModal);

  // Close modal on background click
  document.getElementById('postModal').addEventListener('click', (e) => {
    if (e.target.id === 'postModal') {
      closeModal();
    }
  });

  // Sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      sortType = this.dataset.sort;
      loadPosts();
    });
  });

  // Topic filters
  document.querySelectorAll('.topic-item').forEach(item => {
    item.addEventListener('click', function() {
      document.querySelectorAll('.topic-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      filterTopic = this.dataset.topic;
      loadPosts();
    });
  });

  // Search input
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTerm = e.target.value.trim();
      loadPosts();
    }, 500);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchTerm = e.target.value.trim();
      loadPosts();
    }
  });

  // Add tag button
  document.getElementById('addTagBtn').addEventListener('click', () => {
    const input = document.getElementById('tagField');
    const tag = input.value.trim();
    
    if (tag && !postTags.includes(tag)) {
      postTags.push(tag);
      showTags();
      input.value = '';
    }
  });

  // Add tag on Enter key
  document.getElementById('tagField').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('addTagBtn').click();
    }
  });

  // Submit post button
  document.getElementById('submitPostBtn').addEventListener('click', submitPost);
});

// Make functions available globally
window.handleVote = handleVote;
window.deleteTag = deleteTag;
window.searchByTag = searchByTag;