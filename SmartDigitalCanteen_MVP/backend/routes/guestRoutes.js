import express from 'express';
import {
  getOrCreateGuest,
  updateGuestPreferences,
  trackGuestOrder,
  upgradeGuestToUser,
  sendUpgradeIncentive
} from '../controllers/guestController.js';

const router = express.Router();

router.post('/create', getOrCreateGuest);
router.put('/preferences/:guestId', updateGuestPreferences);
router.post('/track-order', trackGuestOrder);
router.post('/upgrade', upgradeGuestToUser);
router.post('/send-incentive/:guestId', sendUpgradeIncentive);

export default router;
