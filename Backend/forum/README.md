# Forum & Feedback Module (`Backend/forum/`)

This directory houses the complete backend architecture for the **Product Knowledge & Community Forum** module.

---

## 📁 File Structure
- `forumModel.js` — Mongoose Schema (`ForumPost`) modeling discussions, question/suggestion categorization, author metadata, community comments, official admin replies, follow-ups, upvotes, and statuses.
- `forumConstants.js` — Constant definitions for the 6 core modules (`my-flipbooks`, `page-editor`, `customised-editor`, `3d-editor`, `converter`, `account-workspace`) and status configurations.
- `forumController.js` — Express controller logic handling querying, pagination/sorting, discussions creation, commenting, upvoting, admin resolution replies, and status lifecycle.
- `forumRoutes.js` — Express router mounted at `/api/forum`.
- `index.js` — Barrel export for seamless server mounting.

---

## 📡 REST API Endpoints

### Discussions
- `GET /api/forum` — Query discussions with filters (`area`, `moduleId`, `status`, `search`, `sort`, `userEmail`).
- `GET /api/forum/:id` — Fetch post by ID and automatically increment view count.
- `POST /api/forum` — Create a new question or suggestion.
- `POST /api/forum/:id/vote` — Toggle "I have this question too" vote.
- `POST /api/forum/:id/comments` — Add community discussion comment.
- `POST /api/forum/:id/follow-up` — Add follow-up inquiry from post author.
- `POST /api/forum/seed` — Seed default sample topics.

### Admin Operations
- `POST /api/forum/:id/admin-reply` — Post official verified engineering reply and update status (`answered`, `planned`, etc.).
- `POST /api/forum/:id/follow-up/:followUpId/admin-reply` — Reply directly to an author follow-up thread.
- `PATCH /api/forum/:id/status` — Modify discussion lifecycle status.
- `DELETE /api/forum/:id` — Delete discussion topic.
