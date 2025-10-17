# Peer Accountability Fitness Network

A full-stack React Native mobile app built with Expo that helps small groups (2–5 friends) stay consistent with workouts through daily check-ins, streak tracking, and AI-powered motivation.

## 🏗️ Architecture

- **Frontend**: Expo (React Native + TypeScript) with Expo Router, NativeWind, React Native Paper
- **Backend**: Cloudflare Workers with D1 (SQLite) database, R2 storage, and KV caching
- **Authentication**: Supabase for email/social login
- **AI Integration**: Google Gemini for motivational messages, ElevenLabs for voice clips
- **State Management**: Zustand with React Query for server sync
- **Notifications**: Expo Notifications for push reminders

## 📱 Features

- **Group Management**: Create/join fitness groups with invite codes
- **Daily Check-ins**: Photo/text posts to share workout progress
- **Streak Tracking**: Automatic streak calculation and leaderboards
- **AI Motivation**: Gemini-generated motivational messages
- **Voice Clips**: ElevenLabs text-to-speech for audio motivation
- **Push Notifications**: Daily reminders and group activity alerts
- **Real-time Updates**: Live group activity and streak updates

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- Cloudflare account with Workers, D1, R2, and KV access
- Supabase account for authentication
- Google Gemini API key
- ElevenLabs API key (optional)

### 1. Clone and Setup

```bash
git clone <your-repo>
cd GymBro

# Setup Expo app
cd peer-fitness
npm install

# Setup Cloudflare Worker
cd ../fitness-worker
npm install
```

### 2. Environment Configuration

#### Frontend (.env in peer-fitness/)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_API_URL=https://your-worker.your-subdomain.workers.dev
```

#### Backend (wrangler.toml in fitness-worker/)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
R2_BUCKET_NAME=peer-fitness-images
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

### 3. Supabase Setup

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key from Settings > API

2. **Configure Authentication:**
   - Go to Authentication > Settings
   - Enable email authentication
   - Optionally enable Google OAuth (for social login)
   - Add your app URL to Site URL

3. **Get Service Role Key:**
   - Go to Settings > API
   - Copy the `service_role` key (keep this secret!)

### 4. Database Setup

```bash
cd fitness-worker

# Create D1 database
npx wrangler d1 create peer-fitness-db

# Apply schema
npx wrangler d1 migrations apply peer-fitness-db

# For local development
npx wrangler d1 execute peer-fitness-db --local --file=./schema.sql
```

### 5. Cloudflare Services Setup

#### D1 Database
```bash
# Create database
npx wrangler d1 create peer-fitness-db

# Update wrangler.toml with database_id
```

#### R2 Storage
```bash
# Create R2 bucket
npx wrangler r2 bucket create peer-fitness-images
```

#### KV Storage
```bash
# Create KV namespace
npx wrangler kv:namespace create "KV"
```

### 6. Run Locally

#### Backend (Cloudflare Worker)
```bash
cd fitness-worker
npm run dev
```

#### Frontend (Expo App)
```bash
cd peer-fitness
npm start
```

## 📦 Deployment

### Deploy Backend
```bash
cd fitness-worker
npm run deploy
```

### Deploy Frontend
```bash
cd peer-fitness

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for production
eas build --platform all
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/link` - Link push token
- `GET /api/auth/profile` - Get user profile

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create new group
- `POST /api/groups/join` - Join group with invite code
- `GET /api/groups/:id` - Get group details

### Posts
- `POST /api/posts` - Create daily check-in
- `GET /api/posts/group/:groupId` - Get group posts
- `GET /api/posts/streak/:groupId` - Get user's streak
- `GET /api/posts/streaks/:groupId` - Get group streaks

### AI Features
- `POST /api/motivate/generate` - Generate motivational message
- `GET /api/motivate/:groupId` - Get group messages
- `POST /api/voice/generate` - Generate voice clip

### Upload
- `POST /api/upload/image` - Upload image directly
- `POST /api/upload/presigned-url` - Get presigned upload URL

### Notifications
- `POST /api/notify/send` - Send push notification
- `POST /api/notify/schedule-daily` - Schedule daily reminders

## 🗄️ Database Schema

### Users
- `id` (TEXT PRIMARY KEY)
- `clerk_id` (TEXT UNIQUE)
- `email` (TEXT)
- `name` (TEXT)
- `avatar_url` (TEXT)
- `push_token` (TEXT)

### Groups
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT)
- `description` (TEXT)
- `invite_code` (TEXT UNIQUE)
- `created_by` (TEXT)

### Posts
- `id` (TEXT PRIMARY KEY)
- `group_id` (TEXT)
- `user_id` (TEXT)
- `content` (TEXT)
- `image_url` (TEXT)
- `created_at` (DATETIME)

### Streaks
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT)
- `group_id` (TEXT)
- `current_streak` (INTEGER)
- `longest_streak` (INTEGER)
- `last_post_date` (DATE)

## 🔄 Cron Jobs

Daily cron triggers handle:
- Streak resets for inactive users
- Daily reminder notifications
- Motivational message generation

## 🎯 Hackathon Features

### Google Gemini Integration
- Generates personalized motivational messages
- Creates weekly group summaries
- Provides workout tips and encouragement

### ElevenLabs Integration
- Converts motivational messages to audio clips
- Plays voice encouragement in the app
- Supports multiple voice options

### DigitalOcean Gradient (Optional)
- Analytics for consistency insights
- Partner matching algorithms
- Performance tracking

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Authentication Errors**
   - Verify Supabase URL and keys in environment variables
   - Check Supabase dashboard for proper configuration
   - Ensure service role key is used on backend, anon key on frontend

2. **Database Connection Issues**
   - Ensure D1 database is created and migrated
   - Verify database_id in wrangler.toml

3. **Image Upload Failures**
   - Check R2 bucket permissions
   - Verify R2 credentials in environment

4. **Push Notification Issues**
   - Ensure proper notification permissions
   - Check Expo push token configuration

### Development Tips

- Use `npx wrangler dev` for local Worker development
- Use `expo start` with tunnel for testing on physical devices
- Check Cloudflare Workers logs for API debugging
- Use React Query DevTools for state management debugging

## 📄 License

MIT License - feel free to use this project for your hackathon!

## 🤝 Contributing

This is a hackathon project! Feel free to fork, modify, and improve. Key areas for enhancement:

- Enhanced AI features
- Better UI/UX design
- Advanced analytics
- Social features
- Gamification elements

## 📞 Support

For hackathon demo support or questions, check the code comments for implementation details and API usage examples.

---

**Built for hackathon in under 36 hours! 🚀**
