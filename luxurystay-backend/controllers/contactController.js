const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');

// In-memory store for the MVP; replace with a Contact model + DB if you need persistence.
// For now this endpoint validates and acknowledges the submission.

/**
 * POST /api/contact  (public — no auth required)
 * Accepts messages from the public-facing contact page.
 */
exports.submitContact = catchAsync(async (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;

  // Log for visibility; swap in an email service or Contact model as needed
  console.info(
    `[Contact] ${firstName} ${lastName} <${email}> — Subject: ${subject}`
  );

  sendSuccess(res, 201, 'Your message has been received. We will be in touch shortly.', {
    contact: { firstName, lastName, email, subject },
  });
});
