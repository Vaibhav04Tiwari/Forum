// // forum.js - Complete Forum with AWS Cognito Integration (FIXED)

// // Configuration
// const CONFIG = {
//   cognitoDomain: 'us-east-1e2dhvuiye.auth.us-east-1.amazoncognito.com',
//   clientId: '52g34e69k6uu3iddbvpdf8c0ab',
//   // FIXED: Use the correct redirect URI
//   redirectUri: window.location.origin + '/',
//   logoutUri: window.location.origin + '/'
// };

// console.log('🔧 Forum Config:', CONFIG);
// console.log('📍 Current URL:', window.location.href);

// // State management
// let allPosts = [
//   {
//     id: 1,
//     category: 'admissions',
//     author: 'phd_aspirant',
//     verified: true,
//     time: '3h ago',
//     title: 'MIT vs Stanford CS PhD - Which one should I choose?',
//     content: 'Got admits from both. MIT has better lab resources but Stanford has warmer weather. Looking at placement data, both seem similar. Any advice?',
//     tags: ['CS', 'MIT', 'Stanford'],
//     votes: 287,
//     comments: 67,
//     userVote: 0
//   },
//   {
//     id: 2,
//     category: 'funding',
//     author: 'grad_life',
//     verified: false,
//     time: '6h ago',
//     title: 'NSF Fellowship tips - What worked for me',
//     content: 'Finally got NSF after 2 tries. Main thing: focus on broader impacts. Show how your work helps society. Happy to answer questions.',
//     tags: ['NSF', 'Funding'],
//     votes: 423,
//     comments: 89,
//     userVote: 0
//   },
//   {
//     id: 3,
//     category: 'research',
//     author: 'year3phd',
//     verified: true,
//     time: '1d ago',
//     title: 'Switched advisors in 3rd year - Here is what happened',
//     content: 'Research interests changed completely. Was nervous but it worked out. Department was supportive. Feel free to ask anything.',
//     tags: ['Advisor', 'Research'],
//     votes: 156,
//     comments: 234,
//     userVote: 0
//   },
//   {
//     id: 4,
//     category: 'career',
//     author: 'tech_researcher',
//     verified: false,
//     time: '12h ago',
//     title: 'Industry vs Academia after PhD - My experience',
//     content: 'Been at Google Research for 3 years. Comparing with friends in academia. Both paths have pros and cons. AMA.',
//     tags: ['Industry', 'Career'],
//     votes: 98,
//     comments: 156,
//     userVote: 0
//   }
// ];

// let postTags = [];
// let sortType = 'hot';
// let filterTopic = 'all';
// let searchTerm = '';
// let currentUser = null;
// let authToken = null;

// // ==================== Authentication Functions ====================

// function getAuthTokenFromUrl() {
//   // Check URL hash for token (OAuth redirect)
//   const hash = window.location.hash.substring(1);
//   const params = new URLSearchParams(hash);
//   const token = params.get('id_token') || params.get('access_token');
  
//   console.log('🔍 Checking URL for token:', token ? 'Found' : 'Not found');
//   return token;
// }

// function parseJwt(token) {
//   try {
//     const base64Url = token.split('.')[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const jsonPayload = decodeURIComponent(
//       atob(base64)
//         .split('')
//         .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
//         .join('')
//     );
//     return JSON.parse(jsonPayload);
//   } catch (e) {
//     console.error('❌ Error parsing JWT:', e);
//     return null;
//   }
// }

// function initAuth() {
//   console.log('🔐 Initializing authentication...');
  
//   // Check if we have a token in URL (returned from Cognito)
//   const token = getAuthTokenFromUrl();
  
//   if (token) {
//     console.log('✅ Token found in URL');
//     authToken = token;
//     localStorage.setItem('authToken', token);
//     currentUser = parseJwt(token);
//     console.log('👤 User info:', currentUser);
    
//     // Clean URL (remove hash)
//     window.history.replaceState({}, document.title, window.location.pathname);
//     updateUIForAuthState();
//   } else {
//     // Check for stored token
//     const storedToken = localStorage.getItem('authToken');
//     if (storedToken) {
//       const decoded = parseJwt(storedToken);
//       // Check if token is still valid
//       if (decoded && decoded.exp * 1000 > Date.now()) {
//         console.log('✅ Valid token found in storage');
//         authToken = storedToken;
//         currentUser = decoded;
//         updateUIForAuthState();
//       } else {
//         console.log('⚠️ Token expired, removing...');
//         localStorage.removeItem('authToken');
//       }
//     } else {
//       console.log('ℹ️ No token found, user not signed in');
//     }
//   }
// }

// function updateUIForAuthState() {
//   const signInBtn = document.getElementById('signInBtn');
//   const userIcon = document.querySelector('.user-icon');
  
//   if (currentUser) {
//     // Get user name from token
//     const userName = currentUser.name || 
//                      currentUser.email?.split('@')[0] || 
//                      currentUser['cognito:username'] || 
//                      'User';
    
//     console.log('👤 Updating UI for user:', userName);
    
//     signInBtn.textContent = userName;
//     signInBtn.onclick = showUserMenu;
    
//     if (userIcon) {
//       userIcon.textContent = userName.charAt(0).toUpperCase();
//     }
//   } else {
//     signInBtn.textContent = 'Sign In';
//     signInBtn.onclick = signInWithGoogle;
//   }
// }

// function signInWithGoogle() {
//   // Build the Cognito authorization URL
//   const authUrl = `https://${CONFIG.cognitoDomain}/oauth2/authorize?` +
//     `client_id=${CONFIG.clientId}&` +
//     `response_type=token&` +
//     `scope=email+openid+profile&` +
//     `redirect_uri=${encodeURIComponent(CONFIG.redirectUri)}&` +
//     `identity_provider=Google`;
  
//   console.log('🔗 Redirecting to Cognito:', authUrl);
//   window.location.href = authUrl;
// }

// function signOut() {
//   console.log('🚪 Signing out...');
  
//   authToken = null;
//   currentUser = null;
//   localStorage.removeItem('authToken');
  
//   // Redirect to Cognito logout
//   const logoutUrl = `https://${CONFIG.cognitoDomain}/logout?` +
//     `client_id=${CONFIG.clientId}&` +
//     `logout_uri=${encodeURIComponent(CONFIG.logoutUri)}`;
  
//   console.log('🔗 Redirecting to logout:', logoutUrl);
//   window.location.href = logoutUrl;
// }

// function showUserMenu() {
//   const menu = confirm('Sign out?');
//   if (menu) {
//     signOut();
//   }
// }

// // ==================== Post Display Functions ====================

// function displayPosts() {
//   const area = document.getElementById('postsArea');
//   let filtered = [...allPosts];

//   // Filter by topic
//   if (filterTopic !== 'all') {
//     filtered = filtered.filter(p => p.category === filterTopic);
//   }

//   // Filter by search
//   if (searchTerm) {
//     const term = searchTerm.toLowerCase();
//     filtered = filtered.filter(p => 
//       p.title.toLowerCase().includes(term) ||
//       p.content.toLowerCase().includes(term) ||
//       p.tags.some(t => t.toLowerCase().includes(term))
//     );
//   }

//   // Sort posts
//   if (sortType === 'top') {
//     filtered.sort((a, b) => b.votes - a.votes);
//   } else if (sortType === 'new') {
//     filtered.sort((a, b) => b.id - a.id);
//   }

//   // Display results
//   if (filtered.length === 0) {
//     area.innerHTML = '<div class="no-results">No posts found. Be the first to create one!</div>';
//     return;
//   }

//   area.innerHTML = filtered.map(post => `
//     <div class="post">
//       <div class="vote-section">
//         <button class="vote-btn up ${post.userVote === 1 ? 'active' : ''}" onclick="handleVote(${post.id}, 1)">▲</button>
//         <div class="vote-score">${post.votes}</div>
//         <button class="vote-btn down ${post.userVote === -1 ? 'active' : ''}" onclick="handleVote(${post.id}, -1)">▼</button>
//       </div>
//       <div class="post-main">
//         <div class="post-header">
//           <span class="topic-badge ${post.category}">${post.category}</span>
//           <span class="author-name">u/${escapeHtml(post.author)}</span>
//           ${post.verified ? '<span class="verified-icon">✓</span>' : ''}
//           <span>•</span>
//           <span>${post.time}</span>
//         </div>
//         <h3 class="post-title">${escapeHtml(post.title)}</h3>
//         <p class="post-desc">${escapeHtml(post.content)}</p>
//         ${post.tags.length > 0 ? `
//           <div class="post-tags">
//             ${post.tags.map(tag => `<span class="post-tag" onclick="searchByTag('${escapeHtml(tag)}')">#${escapeHtml(tag)}</span>`).join('')}
//           </div>
//         ` : ''}
//         <div class="post-footer">
//           <div class="post-btn">💬 ${post.comments} Comments</div>
//           <div class="post-btn">🔗 Share</div>
//           <div class="post-btn">⭐ Save</div>
//         </div>
//       </div>
//     </div>
//   `).join('');
// }

// function escapeHtml(text) {
//   const div = document.createElement('div');
//   div.textContent = text;
//   return div.innerHTML;
// }

// function handleVote(postId, dir) {
//   if (!authToken) {
//     alert('Please sign in to vote');
//     signInWithGoogle();
//     return;
//   }

//   const post = allPosts.find(p => p.id === postId);
//   if (!post) return;

//   if (post.userVote === dir) {
//     post.votes -= dir;
//     post.userVote = 0;
//   } else {
//     if (post.userVote !== 0) {
//       post.votes -= post.userVote;
//     }
//     post.votes += dir;
//     post.userVote = dir;
//   }

//   displayPosts();
// }

// // ==================== Modal Functions ====================

// function openModal() {
//   if (!authToken) {
//     alert('Please sign in to create a post');
//     signInWithGoogle();
//     return;
//   }
//   document.getElementById('postModal').classList.add('show');
// }

// function closeModal() {
//   document.getElementById('postModal').classList.remove('show');
//   document.getElementById('titleInput').value = '';
//   document.getElementById('contentInput').value = '';
//   postTags = [];
//   showTags();
// }

// function showTags() {
//   const area = document.getElementById('tagsArea');
//   area.innerHTML = postTags.map((tag, idx) => `
//     <div class="tag-pill">
//       ${escapeHtml(tag)}
//       <button class="btn-remove-tag" onclick="deleteTag(${idx})">×</button>
//     </div>
//   `).join('');
// }

// function deleteTag(idx) {
//   postTags.splice(idx, 1);
//   showTags();
// }

// function searchByTag(tag) {
//   searchTerm = tag;
//   document.getElementById('searchInput').value = tag;
//   displayPosts();
// }

// function submitPost() {
//   const title = document.getElementById('titleInput').value.trim();
//   const content = document.getElementById('contentInput').value.trim();
//   const category = document.getElementById('topicSelect').value;

//   if (!title) {
//     alert('Please enter a title for your post');
//     return;
//   }

//   if (!content) {
//     alert('Please enter some content for your post');
//     return;
//   }

//   // Get username from token
//   const userName = currentUser.name || 
//                    currentUser.email?.split('@')[0] || 
//                    currentUser['cognito:username'] || 
//                    'User';

//   // Create new post
//   const newPost = {
//     id: allPosts.length + 1,
//     category: category,
//     author: userName,
//     verified: false,
//     time: 'just now',
//     title: title,
//     content: content,
//     tags: [...postTags],
//     votes: 1,
//     comments: 0,
//     userVote: 1
//   };

//   allPosts.unshift(newPost);
//   displayPosts();
//   closeModal();
//   alert('Your post has been published successfully!');
// }

// // ==================== Initialize ====================

// document.addEventListener('DOMContentLoaded', function() {
//   console.log('🚀 Forum initialized');
//   console.log('📋 Config:', CONFIG);
  
//   // Initialize authentication
//   initAuth();
  
//   // Display posts
//   displayPosts();
  
//   // Modal controls
//   document.getElementById('openModalBtn').addEventListener('click', openModal);
//   document.getElementById('createWidget').addEventListener('click', openModal);
//   document.getElementById('closeModalBtn').addEventListener('click', closeModal);
//   document.getElementById('cancelPostBtn').addEventListener('click', closeModal);

//   // Close modal on background click
//   document.getElementById('postModal').addEventListener('click', (e) => {
//     if (e.target.id === 'postModal') {
//       closeModal();
//     }
//   });

//   // Sort buttons
//   document.querySelectorAll('.sort-btn').forEach(btn => {
//     btn.addEventListener('click', function() {
//       document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
//       this.classList.add('active');
//       sortType = this.dataset.sort;
//       displayPosts();
//     });
//   });

//   // Topic filters
//   document.querySelectorAll('.topic-item').forEach(item => {
//     item.addEventListener('click', function() {
//       document.querySelectorAll('.topic-item').forEach(i => i.classList.remove('active'));
//       this.classList.add('active');
//       filterTopic = this.dataset.topic;
//       displayPosts();
//     });
//   });

//   // Search input
//   const searchInput = document.getElementById('searchInput');
//   searchInput.addEventListener('input', (e) => {
//     searchTerm = e.target.value.trim();
//     displayPosts();
//   });

//   searchInput.addEventListener('keypress', (e) => {
//     if (e.key === 'Enter') {
//       searchTerm = e.target.value.trim();
//       displayPosts();
//     }
//   });

//   // Add tag button
//   document.getElementById('addTagBtn').addEventListener('click', () => {
//     const input = document.getElementById('tagField');
//     const tag = input.value.trim();
    
//     if (tag && !postTags.includes(tag)) {
//       postTags.push(tag);
//       showTags();
//       input.value = '';
//     }
//   });

//   // Add tag on Enter key
//   document.getElementById('tagField').addEventListener('keypress', (e) => {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       document.getElementById('addTagBtn').click();
//     }
//   });

//   // Submit post button
//   document.getElementById('submitPostBtn').addEventListener('click', submitPost);
// });

// // Make functions available globally
// window.handleVote = handleVote;
// window.deleteTag = deleteTag;
// window.searchByTag = searchByTag;



// forum.js - Dual Authentication (Simple + Cognito with debugging)

// Configuration
const CONFIG = {
  cognitoDomain: 'us-east-1e2dhvuiye.auth.us-east-1.amazoncognito.com',
  clientId: '52g34e69k6uu3iddbvpdf8c0ab',
  redirectUri: 'https://main.dwcnsnstg7qh1.amplifyapp.com/',
  logoutUri: 'https://main.dwcnsnstg7qh1.amplifyapp.com/',
  useSimpleAuth: true // Set to false once Cognito is working
};

console.log('🔧 Forum Config:', CONFIG);
console.log('📍 Current URL:', window.location.href);
console.log('📍 Origin:', window.location.origin);

// State management
let allPosts = [
  {
    id: 1,
    category: 'admissions',
    author: 'phd_aspirant',
    verified: true,
    time: '3h ago',
    title: 'MIT vs Stanford CS PhD - Which one should I choose?',
    content: 'Got admits from both. MIT has better lab resources but Stanford has warmer weather. Looking at placement data, both seem similar. Any advice?',
    tags: ['CS', 'MIT', 'Stanford'],
    votes: 287,
    comments: 67,
    userVote: 0
  },
  {
    id: 2,
    category: 'funding',
    author: 'grad_life',
    verified: false,
    time: '6h ago',
    title: 'NSF Fellowship tips - What worked for me',
    content: 'Finally got NSF after 2 tries. Main thing: focus on broader impacts. Show how your work helps society. Happy to answer questions.',
    tags: ['NSF', 'Funding'],
    votes: 423,
    comments: 89,
    userVote: 0
  },
  {
    id: 3,
    category: 'research',
    author: 'year3phd',
    verified: true,
    time: '1d ago',
    title: 'Switched advisors in 3rd year - Here is what happened',
    content: 'Research interests changed completely. Was nervous but it worked out. Department was supportive. Feel free to ask anything.',
    tags: ['Advisor', 'Research'],
    votes: 156,
    comments: 234,
    userVote: 0
  },
  {
    id: 4,
    category: 'career',
    author: 'tech_researcher',
    verified: false,
    time: '12h ago',
    title: 'Industry vs Academia after PhD - My experience',
    content: 'Been at Google Research for 3 years. Comparing with friends in academia. Both paths have pros and cons. AMA.',
    tags: ['Industry', 'Career'],
    votes: 98,
    comments: 156,
    userVote: 0
  }
];

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
  const token = params.get('id_token') || params.get('access_token');
  
  console.log('🔍 Hash:', window.location.hash);
  console.log('🔍 Token:', token ? 'Found' : 'Not found');
  return token;
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('❌ Error parsing JWT:', e);
    return null;
  }
}

function initAuth() {
  console.log('🔐 Initializing authentication...');
  console.log('🔐 Using simple auth:', CONFIG.useSimpleAuth);
  
  if (CONFIG.useSimpleAuth) {
    // Simple authentication
    const user = localStorage.getItem('forumUser');
    if (user) {
      currentUser = JSON.parse(user);
      console.log('✅ Simple auth user found:', currentUser.name);
      updateUIForAuthState();
    }
  } else {
    // Cognito authentication
    const token = getAuthTokenFromUrl();
    
    if (token) {
      console.log('✅ Token found in URL');
      authToken = token;
      localStorage.setItem('authToken', token);
      currentUser = parseJwt(token);
      console.log('👤 User info:', currentUser);
      
      window.history.replaceState({}, document.title, window.location.pathname);
      updateUIForAuthState();
    } else {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        const decoded = parseJwt(storedToken);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          console.log('✅ Valid token found in storage');
          authToken = storedToken;
          currentUser = decoded;
          updateUIForAuthState();
        } else {
          console.log('⚠️ Token expired');
          localStorage.removeItem('authToken');
        }
      }
    }
  }
}

function updateUIForAuthState() {
  const signInBtn = document.getElementById('signInBtn');
  const userIcon = document.querySelector('.user-icon');
  
  if (currentUser) {
    let userName;
    if (CONFIG.useSimpleAuth) {
      userName = currentUser.name;
    } else {
      userName = currentUser.name || 
                 currentUser.email?.split('@')[0] || 
                 currentUser['cognito:username'] || 
                 'User';
    }
    
    console.log('👤 Updating UI for user:', userName);
    
    signInBtn.textContent = userName;
    signInBtn.onclick = showUserMenu;
    
    if (userIcon) {
      userIcon.textContent = userName.charAt(0).toUpperCase();
    }
  } else {
    signInBtn.textContent = 'Sign In';
    signInBtn.onclick = signIn;
  }
}

function signIn() {
  if (CONFIG.useSimpleAuth) {
    // Simple sign in
    const name = prompt('Enter your name to sign in:');
    if (name && name.trim()) {
      currentUser = {
        name: name.trim(),
        id: Date.now()
      };
      localStorage.setItem('forumUser', JSON.stringify(currentUser));
      updateUIForAuthState();
      alert('Welcome, ' + currentUser.name + '! 🎉');
    }
  } else {
    // Cognito sign in
    signInWithGoogle();
  }
}

function signInWithGoogle() {
  const authUrl = `https://${CONFIG.cognitoDomain}/oauth2/authorize?` +
    `client_id=${CONFIG.clientId}&` +
    `response_type=token&` +
    `scope=email+openid+profile&` +
    `redirect_uri=${encodeURIComponent(CONFIG.redirectUri)}&` +
    `identity_provider=Google`;
  
  console.log('🔗 Full auth URL:', authUrl);
  console.log('🔗 Redirect URI:', CONFIG.redirectUri);
  
  window.location.href = authUrl;
}

function signOut() {
  console.log('🚪 Signing out...');
  
  if (CONFIG.useSimpleAuth) {
    currentUser = null;
    localStorage.removeItem('forumUser');
    updateUIForAuthState();
    alert('You have been signed out');
  } else {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    const logoutUrl = `https://${CONFIG.cognitoDomain}/logout?` +
      `client_id=${CONFIG.clientId}&` +
      `logout_uri=${encodeURIComponent(CONFIG.logoutUri)}`;
    
    console.log('🔗 Logout URL:', logoutUrl);
    window.location.href = logoutUrl;
  }
}

function showUserMenu() {
  if (confirm('Sign out?')) {
    signOut();
  }
}

// ==================== Post Display Functions ====================

function displayPosts() {
  const area = document.getElementById('postsArea');
  let filtered = [...allPosts];

  if (filterTopic !== 'all') {
    filtered = filtered.filter(p => p.category === filterTopic);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(term) ||
      p.content.toLowerCase().includes(term) ||
      p.tags.some(t => t.toLowerCase().includes(term))
    );
  }

  if (sortType === 'top') {
    filtered.sort((a, b) => b.votes - a.votes);
  } else if (sortType === 'new') {
    filtered.sort((a, b) => b.id - a.id);
  }

  if (filtered.length === 0) {
    area.innerHTML = '<div class="no-results">No posts found. Be the first to create one!</div>';
    return;
  }

  area.innerHTML = filtered.map(post => `
    <div class="post">
      <div class="vote-section">
        <button class="vote-btn up ${post.userVote === 1 ? 'active' : ''}" onclick="handleVote(${post.id}, 1)">▲</button>
        <div class="vote-score">${post.votes}</div>
        <button class="vote-btn down ${post.userVote === -1 ? 'active' : ''}" onclick="handleVote(${post.id}, -1)">▼</button>
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

function handleVote(postId, dir) {
  if (!currentUser) {
    alert('Please sign in to vote');
    signIn();
    return;
  }

  const post = allPosts.find(p => p.id === postId);
  if (!post) return;

  if (post.userVote === dir) {
    post.votes -= dir;
    post.userVote = 0;
  } else {
    if (post.userVote !== 0) {
      post.votes -= post.userVote;
    }
    post.votes += dir;
    post.userVote = dir;
  }

  displayPosts();
}

// ==================== Modal Functions ====================

function openModal() {
  if (!currentUser) {
    alert('Please sign in to create a post');
    signIn();
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
  displayPosts();
}

function submitPost() {
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

  let userName;
  if (CONFIG.useSimpleAuth) {
    userName = currentUser.name;
  } else {
    userName = currentUser.name || 
               currentUser.email?.split('@')[0] || 
               currentUser['cognito:username'] || 
               'User';
  }

  const newPost = {
    id: allPosts.length + 1,
    category: category,
    author: userName,
    verified: false,
    time: 'just now',
    title: title,
    content: content,
    tags: [...postTags],
    votes: 1,
    comments: 0,
    userVote: 1
  };

  allPosts.unshift(newPost);
  displayPosts();
  closeModal();
  alert('Your post has been published successfully! 🎉');
}

// ==================== Initialize ====================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Forum initialized');
  console.log('📋 Config:', CONFIG);
  
  initAuth();
  displayPosts();
  
  document.getElementById('openModalBtn').addEventListener('click', openModal);
  document.getElementById('createWidget').addEventListener('click', openModal);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelPostBtn').addEventListener('click', closeModal);

  document.getElementById('postModal').addEventListener('click', (e) => {
    if (e.target.id === 'postModal') {
      closeModal();
    }
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      sortType = this.dataset.sort;
      displayPosts();
    });
  });

  document.querySelectorAll('.topic-item').forEach(item => {
    item.addEventListener('click', function() {
      document.querySelectorAll('.topic-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      filterTopic = this.dataset.topic;
      displayPosts();
    });
  });

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    displayPosts();
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchTerm = e.target.value.trim();
      displayPosts();
    }
  });

  document.getElementById('addTagBtn').addEventListener('click', () => {
    const input = document.getElementById('tagField');
    const tag = input.value.trim();
    
    if (tag && !postTags.includes(tag)) {
      postTags.push(tag);
      showTags();
      input.value = '';
    }
  });

  document.getElementById('tagField').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('addTagBtn').click();
    }
  });

  document.getElementById('submitPostBtn').addEventListener('click', submitPost);
});

window.handleVote = handleVote;
window.deleteTag = deleteTag;
window.searchByTag = searchByTag;