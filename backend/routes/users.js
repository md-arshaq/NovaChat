const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getOnlineUsers, getMyProfile, getUserProfile, updateProfile } = require('../controllers/userController');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ngd_avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// All user routes are protected
router.use(authMiddleware);

router.get('/online', getOnlineUsers);
router.get('/me', getMyProfile);
router.get('/profile/:username', getUserProfile);
router.put('/profile', upload.single('avatar'), updateProfile);

module.exports = router;
