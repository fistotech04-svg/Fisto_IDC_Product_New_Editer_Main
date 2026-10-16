import express from 'express';
import { submitLead, getLeads } from './leadController.js';

const router = express.Router();

// Routes for lead form
router.post(['/submit-lead', '/public/submit-lead'], submitLead);
router.get('/get-leads', getLeads);

export default router;
