/**
 * IntellMeet Backend – Analytics Routes
 * Base: /api/analytics
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/personal', verifyToken, analyticsController.getPersonalAnalytics);
router.get('/team/:teamId', verifyToken, analyticsController.getTeamAnalytics);
router.get('/meetings/trends', verifyToken, analyticsController.getMeetingTrends);
router.get('/productivity', verifyToken, analyticsController.getProductivity);

module.exports = router;
