# Valence — GitHub Copilot Instructions

# Auto-loaded by VS Code for this workspace.

# Read this fully before suggesting anything.

---

## What This Project Is

A full-stack mood-based music recommendation system.
The user chats with an AI agent. The agent detects their emotional state using
NLP (NRC-VAD Lexicon). It maps that emotion onto Russell's Circumplex Model
(a 2D Valence-Arousal plane). It then recommends Spotify songs that gradually
guide the user from their current mood toward their desired goal state.

This is a **portfolio project** built to production standard for job interviews.
It must be clean, well-structured, and demonstrate senior-level engineering.

---

## Developer Context

- Name: Aadil Fayas P
- Role: Senior Full Stack Engineer (3+ years, Cognizant / AMEX)
- Stack comfort level: HIGH for Java, Spring Boot, React, PostgreSQL
- IDE: VS Code
- Pen name / creative identity: Psychosomatic Poet

---

## Tech Stack — Do NOT suggest alternatives

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Backend     | Java 21, Spring Boot 4.x             |
| Security    | Spring Security 6, JWT (jjwt)        |
| ORM         | Spring Data JPA, Hibernate           |
| Database    | PostgreSQL (Railway)                 |
| HTTP Client | RestTemplate (no WebClient)          |
| Build tool  | Maven                                |
| Frontend    | React 18 (Vite), JavaScript (no TS)  |
| Charts      | Chart.js + react-chartjs-2           |
| HTTP calls  | Axios                                |
| Routing     | react-router-dom v6                  |
| Deployment  | Railway (backend), Vercel (frontend) |

**Hard rules:**

- Do NOT suggest Kotlin, Gradle, WebFlux, TypeScript, Redux, or Next.js
- Do NOT suggest microservices — this is a single Spring Boot monolith
- Do NOT suggest Docker — Railway handles containerisation
- Do NOT suggest MongoDB or any NoSQL database
- Always use constructor injection, never field injection (@Autowired on field)
- Always use DTOs — never expose JPA entities directly from controllers
- Never use Lombok @Data on JPA entities — use @Getter @Setter separately

---

## Project Structure

```
valence-api/                        # Spring Boot backend
  src/main/java/com/valence/
    auth/                            # AuthController, AuthService, JwtUtil
    mood/                            # MoodController, MoodService, NrcVadAnalyzer
    recommendation/                  # RecommendController, RecommendService, SpotifyClient
    model/                           # JPA entities: User, MoodSession, Recommendation, SongCache
    repository/                      # Spring Data JPA repositories
    config/                          # SecurityConfig, CorsConfig
    dto/                             # All request/response DTOs
  src/main/resources/
    application.yml
    nrc-vad-lexicon.csv              # NRC-VAD lexicon loaded at startup

valence-ui/                         # React frontend
  src/
    components/
      Chat/                          # ChatWindow.jsx, MessageBubble.jsx
      MoodPlane/                     # RussellPlane.jsx (Chart.js scatter)
      Songs/                         # SongCard.jsx
      Dashboard/                     # MoodHistory.jsx
    pages/                           # Login.jsx, Home.jsx, Dashboard.jsx
    services/                        # api.js (Axios instance), auth.js
    context/                         # AuthContext.jsx
    App.jsx
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mood sessions (one per chat conversation)
CREATE TABLE mood_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  raw_text TEXT,
  valence_score DOUBLE PRECISION,
  arousal_score DOUBLE PRECISION,
  goal_valence DOUBLE PRECISION,
  goal_arousal DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual recommendations within a session
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES mood_sessions(id),
  spotify_track_id VARCHAR(100),
  track_name VARCHAR(255),
  artist VARCHAR(255),
  valence DOUBLE PRECISION,
  energy DOUBLE PRECISION,
  position_in_path INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cache to avoid redundant Spotify API calls
CREATE TABLE song_cache (
  spotify_track_id VARCHAR(100) PRIMARY KEY,
  track_name VARCHAR(255),
  artist VARCHAR(255),
  valence DOUBLE PRECISION,
  energy DOUBLE PRECISION,
  genre VARCHAR(100),
  cached_at TIMESTAMP DEFAULT NOW()
);
```

---

## Core API Endpoints

| Method | Endpoint                         | Auth   | Description                            |
| ------ | -------------------------------- | ------ | -------------------------------------- |
| POST   | /api/auth/register               | Public | Create user account                    |
| POST   | /api/auth/login                  | Public | Returns JWT                            |
| POST   | /api/mood/analyze                | JWT    | Accepts text, returns VA scores        |
| POST   | /api/mood/session                | JWT    | Creates mood session with goal state   |
| GET    | /api/mood/sessions               | JWT    | User's mood history (paginated)        |
| GET    | /api/recommendations/{sessionId} | JWT    | Returns ordered Spotify track list     |
| POST   | /api/recommendations/next        | JWT    | Re-evaluates next recommendation batch |

---

## Key Algorithms — Understand Before Suggesting Code

### 1. NRC-VAD Mood Analysis

- Load `nrc-vad-lexicon.csv` at startup into `HashMap<String, double[]>`
  where double[] = [valence, arousal, dominance]
- On input text: lowercase → remove punctuation → split by space → look up each token
- Aggregate: average valence and average arousal of all matched tokens
- Map to Russell quadrant:
  - Q1 (+V, +A) = Happy
  - Q2 (-V, +A) = Angry
  - Q3 (-V, -A) = Sad
  - Q4 (+V, -A) = Calm
- Return: MoodScoreDto { valence, arousal, emotion, matchedWords }

### 2. Recommendation Path Algorithm

- Input: currentVA [v1, a1], goalVA [v2, a2]
- Generate 5 evenly spaced waypoints using linear interpolation:
  waypoint[i] = [v1 + i*(v2-v1)/4, a1 + i*(a2-a1)/4] for i = 0..4
- For each waypoint: fetch Spotify tracks, compute Euclidean distance
  from each track's [valence, energy] to the waypoint, sort ascending
- Take top 2 tracks per waypoint = 10 tracks total, ordered
- Euclidean distance: Math.sqrt(Math.pow(v1-v2,2) + Math.pow(a1-a2,2))

### 3. Spotify Integration

- Auth: Client Credentials Flow (no user login needed)
  POST https://accounts.spotify.com/api/token
  body: grant_type=client_credentials
  header: Authorization: Basic base64(clientId:clientSecret)
- Cache token, refresh 60 seconds before expiry
- Track features: GET https://api.spotify.com/v1/audio-features/{id}
  Returns: valence (0-1), energy (0-1) — maps directly to Russell's VA plane
- Check song_cache table before calling Spotify; cache miss → fetch + store

---

## React Frontend Patterns

- AuthContext stores JWT token and user object, exposes login() logout() helpers
- All API calls go through `src/services/api.js` Axios instance
  — base URL from VITE_API_BASE_URL env var
  — request interceptor adds Authorization: Bearer <token> header
  — response interceptor: on 401, clear token and redirect to /login
- Protected routes: wrapper component checks AuthContext, redirects if no token
- RussellPlane.jsx uses Chart.js Scatter chart
  — x-axis = Valence (-1 to 1), y-axis = Arousal (-1 to 1)
  — Quadrant labels as annotations
  — Dataset 1: current mood (blue dot), Dataset 2: goal (green dot),
  Dataset 3: recommendation path (grey line)

---

## Code Style Rules

**Java:**

- Package: com.valence.\*
- All controllers annotated: @RestController @RequestMapping @RequiredArgsConstructor
- Services annotated: @Service @RequiredArgsConstructor @Transactional
- Repositories extend JpaRepository<Entity, UUID>
- DTOs in com.valence.dto — suffix Request/Response (e.g. LoginRequest, LoginResponse)
- Error handling: @ControllerAdvice GlobalExceptionHandler returns ApiErrorResponse
- Logging: use SLF4J @Slf4j, log at INFO for service actions, DEBUG for internals

**React:**

- Functional components only, no class components
- Hooks only: useState, useEffect, useContext, useCallback
- No inline styles — use CSS modules or a single App.css
- Component files: PascalCase.jsx
- Service files: camelCase.js
- All async calls wrapped in try/catch with error state

---

## Environment Variables

**Backend (application.yml / Railway env vars):**

```
SPRING_DATASOURCE_URL=jdbc:postgresql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
JWT_SECRET=...                  # min 256-bit secret
JWT_EXPIRY_MS=86400000          # 24 hours
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

**Frontend (.env / Vercel env vars):**

```
VITE_API_BASE_URL=https://your-app.railway.app
```

---

## What This Project Is NOT

- Not a microservices system — one Spring Boot app, one PostgreSQL DB
- Not real-time — no WebSockets, no SSE
- Not a Spotify clone — no full playback, just track links and metadata
- Not mobile — web only
- Not using AI/ML models — rule-based NLP via lexicon lookup only

---

## When You're Unsure

If a suggestion would require adding a new dependency not listed above,
adding a new service not in the folder structure, or changing the database
schema — flag it as a NOTE and explain the tradeoff. Don't silently change
the architecture.

---

# End of instructions. Build something worth shipping.
