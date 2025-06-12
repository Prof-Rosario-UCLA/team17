# team17

Triv.AI is a full-stack, multiplayer trivia web platform that dynamically generates questions using OpenAI. Built with React, Node.js, WebSockets, MongoDB, and WebAssembly (via AssemblyScript), the app lets users join rooms, compete in timed rounds, and interact with real-time score updates.

## 🌐 Live Deployment

Triv.AI is deployed on **Google App Engine (GAE)** with continuous integration via **Cloud Build**. HTTPS is enabled by default using App Engine's `*.appspot.com` subdomain.

---

## 🚀 Deploying the App (Google App Engine)

### ✅ Prerequisites

- Node.js (v18+)
- A Google Cloud Project
- `gcloud` CLI installed and authenticated (`gcloud init`)
- APIs enabled:
  - Cloud Build API
  - App Engine Admin API
  - Cloud Resource Manager API

---

### 1. **Set up your scripts in `package.json`**:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "start": "node src/server/server.js"
  }
````

> Install `serve` locally:

```bash
npm install --save-dev serve
```

---

### 2. **Create `app.yaml`** (for Google App Engine):

```yaml
runtime: nodejs20

entrypoint: npm start

handlers:
  - url: /
    static_files: dist/index.html
    upload: dist/index.html

  - url: /(.*)
    static_files: dist/\1
    upload: dist/(.*)

  - url: /.*
    script: auto

readiness_check:
  path: '/_ah/ready'
  check_interval_sec: 5
  timeout_sec: 4
  failure_threshold: 2
  success_threshold: 2
  app_start_timeout_sec: 300
```

---

### 3. **Create `.cloudbuild.yaml`** (for CI/CD):

```yaml
steps:
- name: 'gcr.io/cloud-builders/npm'
  args: ['install']
  dir: '.'

- name: 'gcr.io/cloud-builders/npm'
  args: ['run', 'build']
  dir: '.'

- name: 'gcr.io/cloud-builders/gcloud'
  args: ['app', 'deploy', '--quiet']
  dir: '.'

timeout: '900s'
```

---

### 4. **Push to GitHub & Configure Cloud Build Trigger**:

* Connect your GitHub repo to Google Cloud Build.
* Create a trigger for the `main` branch.
* Set build config to `.cloudbuild.yaml`.

---

## 📦 Local Development

```bash
npm install
npm run dev
```

---

## 📡 API & WebSocket Documentation

Triv.AI primarily uses **WebSocket** for real-time multiplayer interactions. A few auxiliary REST API endpoints are used for leaderboard data and App Engine readiness checks.

---

### 🔌 WebSocket Events

WebSocket communication is initiated at:

```
ws://cs144-25s-emanuelzavalza.uw.r.appspot.com/
```

#### Event: `CREATE_USER`

Creates or resets a user.

```json
{
  "type": "CREATE_USER",
  "userId": "abc123",
  "userName": "Alice"
}
```

#### Event: `CREATE_ROOM`

Creates a room and assigns user as host.

```json
{
  "type": "CREATE_ROOM",
  "userId": "abc123"
}
```

🟢 Response: `{ type: "ROOM_CREATED", roomCode }`

---

#### Event: `JOIN_ROOM`

Adds a user to an existing room.

```json
{
  "type": "JOIN_ROOM",
  "roomCode": "XYZ789",
  "userId": "abc123"
}
```

🟢 Response: `{ type: "ROOM_JOINED", roomCode }`

---

#### Event: `PLAYER_READY`

Marks a player as ready.

```json
{
  "type": "PLAYER_READY",
  "roomCode": "XYZ789",
  "userId": "abc123"
}
```

🟢 Response (broadcasted):

```json
{
  "type": "PLAYER_READY_COUNT",
  "roomCode": "XYZ789",
  "totalPlayers": 3,
  "playerReady": 2
}
```

---

#### Event: `SUBMIT_THEME`

Adds a theme suggestion to the room.

```json
{
  "type": "SUBMIT_THEME",
  "roomCode": "XYZ789",
  "theme": "Astronomy"
}
```

🟢 Response:

```json
{
  "type": "THEMES_SENT",
  "roomCode": "XYZ789",
  "themes": "Astronomy"
}
```

---

#### Event: `QUESTION_READY`

Triggers AI question generation using OpenAI based on two random themes.

```json
{
  "type": "QUESTION_READY",
  "roomCode": "XYZ789"
}
```

🟢 Response (broadcasted):

```json
{
  "type": "QUESTION_SENT",
  "roomCode": "XYZ789",
  "themes": ["Astronomy", "History"],
  "question": "Which astronomer changed how we view time in history?",
  "answer": ["Einstein", "Galileo", "Newton", "Kepler"],
  "startTime": 1718093910000,
  "duration": 10000
}
```

---

#### Event: `ANSWER_SUBMISSION`

Submits a user's answer. If correct, adds 10 points.

```json
{
  "type": "ANSWER_SUBMISSION",
  "roomCode": "XYZ789",
  "userId": "abc123",
  "answer": "Einstein"
}
```

🟢 Response (broadcasted):

```json
{
  "type": "CORRECT_ANSWER",
  "roomCode": "XYZ789",
  "correctAnswer": "Einstein",
  "scores": {
    "abc123": {
      "name": "Alice",
      "points": 10
    }
  },
  "startTime": 1718093930000,
  "duration": 2500
}
```

---

### 🌐 REST API Endpoints

#### `POST /leaderboard/local/:userId`

Updates a user's local leaderboard with new scores.

```http
POST /leaderboard/local/abc123
Content-Type: application/json

{
  "entries": [
    { "score": 30, "date": "2025-06-10" },
    { "score": 25, "date": "2025-06-09" }
  ]
}
```

✅ **Returns** `200 OK` on success.

---

#### `GET /leaderboard/top/:userId`

Retrieves top 5 scores from a user's local leaderboard.

```http
GET /leaderboard/top/abc123
```

✅ **Response**

```json
[
  { "score": 40, "date": "2025-06-01" },
  { "score": 35, "date": "2025-05-30" }
]
```

---

#### `GET /_ah/ready`

Health check endpoint for Google App Engine.

```http
GET /_ah/ready
→ 200 OK
```

---

## 🛠 Tech Stack

* **Frontend**: Vite + React
* **Backend**: Node.js + Express
* **Realtime**: WebSocket API
* **AI**: OpenAI API (dynamic trivia generation)
* **Database**: MongoDB Atlas
* **WebAssembly**: AssemblyScript (for score calculation optimizations)
* **Deployment**: Google App Engine
* **CI/CD**: Google Cloud Build

---
