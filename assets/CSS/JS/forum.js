// forum.js - Simplified Professional Version

document.addEventListener('DOMContentLoaded', function() {
  
  // Filter Tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const filterType = this.dataset.filter;
      console.log('Filter:', filterType);
    });
  });
  
  // Vote System
  const voteBtns = document.querySelectorAll('.vote-btn');
  voteBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const isActive = this.classList.contains('active');
      const voteSection = this.closest('.vote-section');
      const allVotes = voteSection.querySelectorAll('.vote-btn');
      const voteCount = voteSection.querySelector('.vote-count');
      let currentVotes = parseInt(voteCount.textContent);
      
      allVotes.forEach(v => {
        if (v.classList.contains('active')) {
          if (v.classList.contains('upvote')) currentVotes--;
          if (v.classList.contains('downvote')) currentVotes++;
          v.classList.remove('active');
        }
      });
      
      if (!isActive) {
        this.classList.add('active');
        if (this.classList.contains('upvote')) currentVotes++;
        else if (this.classList.contains('downvote')) currentVotes--;
      }
      
      voteCount.textContent = currentVotes;
    });
  });
  
  // Post Title Click
  const postTitles = document.querySelectorAll('.post-title');
  postTitles.forEach(title => {
    title.addEventListener('click', function() {
      console.log('Opening post:', this.textContent);
    });
  });
  
  // Post Actions
  const postStats = document.querySelectorAll('.post-stat');
  postStats.forEach(stat => {
    stat.addEventListener('click', function(e) {
      e.stopPropagation();
      const action = this.dataset.action;
      
      if (action === 'share') {
        const postCard = this.closest('.post-card');
        const postTitle = postCard.querySelector('.post-title').textContent;
        
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href)
            .then(() => alert('Link copied to clipboard!'))
            .catch(() => alert('Failed to copy link'));
        }
      } else if (action === 'save') {
        const text = this.querySelector('span').textContent;
        this.querySelector('span').textContent = text === 'Save' ? 'Saved' : 'Save';
      }
    });
  });
  
  // Tags
  const tags = document.querySelectorAll('.tag');
  tags.forEach(tag => {
    tag.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log('Tag:', this.textContent);
    });
  });
  
  // Categories
  const categoryItems = document.querySelectorAll('.category-item');
  categoryItems.forEach(item => {
    item.addEventListener('click', function() {
      console.log('Category:', this.dataset.category);
    });
  });
  
  // Search
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  
  function performSearch() {
    const query = searchInput.value.trim();
    if (query) console.log('Search:', query);
  }
  
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') performSearch();
  });
  
  // New Post
  document.getElementById('new-post-btn').addEventListener('click', function() {
    alert('Create New Post\n\nThis feature will be implemented.');
  });
  
  // Sign In
  document.getElementById('signin-btn').addEventListener('click', function() {
    window.location.href = 'https://www.pandainuniv.com/login';
  });
  
  console.log('Forum initialized');
});