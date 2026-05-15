const express = require('express');
const router  = express.Router();

const contactController = require('../controllers/contactController');
const validate = require('../middleware/validate');
const { submitContactValidator } = require('../validators/contactValidators');

// Public endpoint — no authentication required
router.post('/', submitContactValidator, validate, contactController.submitContact);

module.exports = router;
