const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'postscan_super_secret_jwt_key_123!', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please provide username and password' });
  }

  try {
    // Check for user
    const user = await User.findOne({ username }).populate('postOfficeId');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        postOfficeId: user.postOfficeId,
        // 🔥 NEW: Returning beat metrics upon successful login tracking
        beatNumber: user.beatNumber || null,
        region: user.region || null,
        languagePreference: user.languagePreference || 'en'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('postOfficeId');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        postOfficeId: user.postOfficeId,
        // 🔥 NEW: Returning beat metrics for current user profile state synchronization
        beatNumber: user.beatNumber || null,
        region: user.region || null,
        languagePreference: user.languagePreference || 'en'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Update user language preference
// @route   PUT /api/auth/preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  const { language } = req.body;
  if (!language) {
    return res.status(400).json({ success: false, message: 'Please provide language code' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.languagePreference = language;
    await user.save();
    res.json({ success: true, message: 'Language preference updated', languagePreference: user.languagePreference });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide both old and new password' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// === Admin User Management Endpoints ===

// @desc    Get list of all users
// @route   GET /api/auth/users
// @access  Private (Admin)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({}).populate('postOfficeId').select('-password');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Add office staff or postman
// @route   POST /api/auth/users
// @access  Private (Admin)
router.post('/users', protect, authorize('admin'), async (req, res) => {
  // 🔥 UPDATED: Added assignedBeat and assignedRegion properties incoming from Flutter client payload maps
  const { username, password, name, role, postOfficeId, assignedBeat, assignedRegion } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ success: false, message: 'Please fill in all user profile details' });
  }

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // Create user with explicit Beat configuration parameters map layout data structure bounds
    const newUser = await User.create({
      username,
      password,
      name,
      role,
      postOfficeId: postOfficeId || null,
      // 🔥 NEW: Conditionally attach beat metric mappings on server write transaction executions
      beatNumber: role === 'postman' ? (assignedBeat || null) : null,
      region: role === 'postman' ? (assignedRegion || null) : null
    });

    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} account created successfully!`,
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        beatNumber: newUser.beatNumber,
        region: newUser.region
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Delete user account
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting oneself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account!' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User account successfully deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;