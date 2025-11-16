// server.js - Node.js Backend with Express, MongoDB, and Cognito
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schema for Posts
const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String],
  votes: { type: Number, default: 1 },
  comments: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// MongoDB Schema for Votes
const voteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  postId: { type: String, required: true },
  vote: { type: Number, enum: [-1, 0, 1], required: true }
});

const Vote = mongoose.model('Vote', voteSchema);

// Cognito JWT verification setup
const cognitoIssuer = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;
const client = jwksClient({
  jwksUri: `${cognitoIssuer}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    }
  });
}

// Middleware to verify Cognito JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, getKey, {
    issuer: cognitoIssuer,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// API Routes

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const { category, search, sort = 'hot' } = req.query;
    
    let query = {};
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Sorting
    let sortOption = {};
    if (sort === 'new') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'top') {
      sortOption = { votes: -1 };
    } else { // hot
      sortOption = { votes: -1, createdAt: -1 };
    }
    
    const posts = await Post.find(query).sort(sortOption);
    
    // If user is authenticated, include their votes
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        jwt.verify(token, getKey, { issuer: cognitoIssuer, algorithms: ['RS256'] }, async (err, decoded) => {
          if (!err && decoded) {
            const userVotes = await Vote.find({ userId: decoded.sub });
            const voteMap = {};
            userVotes.forEach(v => {
              voteMap[v.postId] = v.vote;
            });
            
            const postsWithVotes = posts.map(post => ({
              ...post.toObject(),
              userVote: voteMap[post._id.toString()] || 0
            }));
            
            return res.json(postsWithVotes);
          } else {
            return res.json(posts);
          }
        });
      } catch (error) {
        return res.json(posts);
      }
    } else {
      res.json(posts);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new post (requires authentication)
app.post('/api/posts', verifyToken, async (req, res) => {
  try {
    const { category, title, content, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const newPost = new Post({
      userId: req.user.sub,
      userEmail: req.user.email,
      userName: req.user.name || req.user.email.split('@')[0],
      category: category || 'admissions',
      title,
      content,
      tags: tags || []
    });
    
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on a post (requires authentication)
app.post('/api/posts/:postId/vote', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { vote } = req.body; // vote should be -1, 0, or 1
    
    if (![-1, 0, 1].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote value' });
    }
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Find existing vote
    let existingVote = await Vote.findOne({
      userId: req.user.sub,
      postId: postId
    });
    
    if (existingVote) {
      // Update vote count
      const voteDiff = vote - existingVote.vote;
      post.votes += voteDiff;
      existingVote.vote = vote;
      await existingVote.save();
    } else {
      // Create new vote
      existingVote = new Vote({
        userId: req.user.sub,
        postId: postId,
        vote: vote
      });
      post.votes += vote;
      await existingVote.save();
    }
    
    await post.save();
    res.json({ votes: post.votes, userVote: vote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a post (requires authentication and ownership)
app.delete('/api/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.userId !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    await Post.findByIdAndDelete(postId);
    await Vote.deleteMany({ postId: postId });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's own posts
app.get('/api/my-posts', verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.user.sub }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});