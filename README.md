# NoteTheMood

NoteTheMood is a MERN note-taking app with a feed-style UI, authentication, public note browsing, private notes, and a compact editor experience inspired by modern shadcn-style interfaces.

## Features

- Sign up and sign in with JWT authentication
- Browse public notes in a feed layout
- Switch between all public notes and your own notes
- Search, sort, and filter notes by mood and visibility
- Create, edit, and delete notes
- View note owner names
- Single-service deployment support on Render

## Tech Stack

- Frontend: React, React Scripts
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Auth: JSON Web Tokens
- Styling: Custom CSS with shadcn-inspired visual patterns

## Project Structure

- `frontend/` - React app and UI
- `backend/` - Express API and MongoDB models
- `render.yaml` - Render Blueprint configuration

## Local Setup

### Prerequisites

- Node.js 18+ recommended
- MongoDB database, local or Atlas

### 1. Clone and install

```bash
git clone https://github.com/Alamicrodev/Cool-Notes-MERNStack.git
cd Cool-Notes-MERNStack
```

### 2. Configure the backend

Create `backend/.env` with:

```env
DB_URL=mongodb://127.0.0.1:27017/notesDBCluster
PORT=3000
JWT_SECRET=your-long-secret
```

If you are using MongoDB Atlas, replace `DB_URL` with your Atlas connection string.

### 3. Run the backend

```bash
cd backend
npm install
npm start
```

The API will run on `http://localhost:3000`.

### 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

If port `3000` is already in use by the backend, accept the CRA prompt to run the frontend on another port such as `3001`.

The frontend talks to the backend through the `/api/v1` proxy in development.

## Environment Variables

### Backend

- `DB_URL` - MongoDB connection string
- `PORT` - Server port, defaults to `5000` in code if not provided
- `JWT_SECRET` - Secret used to sign JWTs

### Frontend

- `REACT_APP_API_URL` - Optional override for the API base URL

If `REACT_APP_API_URL` is not set, the frontend uses `/api/v1`, which works with the Render deployment setup.

## API Overview

The backend API is mounted at `/api/v1`.

### Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Notes

- `GET /api/v1/notes` - Public notes
- `GET /api/v1/notes/profile/:userID` - User notes
- `POST /api/v1/notes/note` - Create note
- `GET /api/v1/notes/note/:noteID` - Get one note
- `PATCH /api/v1/notes/note/:noteID` - Update note
- `DELETE /api/v1/notes/note/:noteID` - Delete note
- `DELETE /api/v1/notes/profile/:userID` - Bulk delete notes, currently a stub

### Users

- `GET /api/v1/users/user/:userID` - Get user name

### Health Check

- `GET /healthz`

## Deployment

This repo is set up for a single Render Web Service that serves both the API and the built frontend.

### Render setup

- Service type: **Web Service**
- Build command:

```bash
cd frontend && npm install && npm run build && cd ../backend && npm install
```

- Start command:

```bash
cd backend && npm start
```

- Health check path: `/healthz`

### Required Render environment variables

- `DB_URL`
- `JWT_SECRET`

### MongoDB Atlas

If you deploy with Atlas, make sure the cluster allows connections from Render. During testing, the simplest option is to allow `0.0.0.0/0` in Atlas Network Access, then tighten it later if needed.

## Notes

- The frontend is a real app shell now, not the default CRA starter.
- The backend serves the production React build automatically when `frontend/build` exists.
- The note bulk-delete route exists on the backend, but the controller is still a placeholder.

## License

No license has been specified yet.
