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

function displayPosts() {
  const area = document.getElementById('postsArea');
  let filtered = [...allPosts];

  // Filter by topic
  if (filterTopic !== 'all') {
    filtered = filtered.filter(p => p.category === filterTopic);
  }

  // Filter by search
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(term) ||
      p.content.toLowerCase().includes(term) ||
      p.tags.some(t => t.toLowerCase().includes(term))
    );
  }

  // Sort posts
  if (sortType === 'top') {
    filtered.sort((a, b) => b.votes - a.votes);
  } else if (sortType === 'new') {
    filtered.sort((a, b) => b.id - a.id);
  }

  // Display results
  if (filtered.length === 0) {
    area.innerHTML = '<div class="no-results">No posts found matching your search</div>';
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
          <span class="author-name">u/${post.author}</span>
          ${post.verified ? '<span class="verified-icon">✓</span>' : ''}
          <span>•</span>
          <span>${post.time}</span>
        </div>
        <h3 class="post-title">${post.title}</h3>
        <p class="post-desc">${post.content}</p>
        ${post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="post-tag" onclick="searchByTag('${tag}')">#${tag}</span>`).join('')}
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

function handleVote(postId, dir) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;

  if (post.userVote === dir) {
    // Remove vote
    post.votes -= dir;
    post.userVote = 0;
  } else {
    // Change or add vote
    if (post.userVote !== 0) {
      post.votes -= post.userVote;
    }
    post.votes += dir;
    post.userVote = dir;
  }

  displayPosts();
}

function openModal() {
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
      ${tag}
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  
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
      displayPosts();
    });
  });

  // Topic filters
  document.querySelectorAll('.topic-item').forEach(item => {
    item.addEventListener('click', function() {
      document.querySelectorAll('.topic-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      filterTopic = this.dataset.topic;
      displayPosts();
    });
  });

  // Search input
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
  document.getElementById('submitPostBtn').addEventListener('click', () => {
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

    // Create new post
    const newPost = {
      id: allPosts.length + 1,
      category: category,
      author: 'you',
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

    // Show success message
    alert('Your post has been published successfully!');
  });

  // Sign in button
  document.getElementById('signInBtn').addEventListener('click', () => {
    window.location.href = 'https://www.pandainuniv.com/login';
  });

  // Initial render
  displayPosts();
});