const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { getUsers } = require('../controllers/userController');

const router = express.Router();

router.get('/', auth, adminOnly, getUsers);

module.exports = router;
