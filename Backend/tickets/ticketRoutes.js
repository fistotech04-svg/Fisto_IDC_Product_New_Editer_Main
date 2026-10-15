// Backend/tickets/ticketRoutes.js
import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  addTicketMessage,
  cancelTicket
} from './ticketController.js';

const router = express.Router();

// GET all tickets with filtering / pagination
router.get('/', getTickets);

// POST create a new support ticket
router.post('/', createTicket);

// GET ticket by ID
router.get('/:id', getTicketById);

// PATCH update status ('open' or 'closed')
router.patch('/:id/status', updateTicketStatus);

// POST post a reply/message to conversation thread
router.post('/:id/messages', addTicketMessage);

// DELETE withdraw/cancel ticket (before admin replies)
router.delete('/:id', cancelTicket);

export default router;
