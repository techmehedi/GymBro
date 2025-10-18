# GymBro - Fitness Accountability App

A full-stack React Native mobile app built with Expo that helps small groups (2-5 friends) stay consistent with workouts through daily check-ins, streak tracking, and AI-powered motivation.

## 🏗️ Project Structure

```
GymBro/
├── frontend/          # Expo React Native app
│   ├── app/          # Expo Router pages
│   │   ├── (tabs)/  # Tab navigation screens
│   │   ├── auth/    # Authentication screens
│   │   └── _layout.tsx
│   ├── components/  # Reusable UI components
│   ├── lib/         # Utilities and configurations
│   ├── store/       # Zustand state management
│   └── types/       # TypeScript type definitions
├── backend/          # Cloudflare Worker API
│   ├── src/
│   │   ├── routes/  # API route handlers
│   │   ├── types/   # Shared types
│   │   └── index.ts # Main Worker entry point
│   ├── schema.sql   # D1 database schema
│   └── wrangler.toml
└── docs/            # Documentation
```

## 🚀 Tech Stack

### Frontend (Mobile App)
- **Framework**: Expo (React Native + TypeScript)
- **Navigation**: Expo Router
- **Styling**: NativeWind (TailwindCSS for RN)
- **UI Components**: React Native Paper
- **State Management**: Zustand
- **Server Sync**: React Query (TanStack)
- **Notifications**: Expo Notifications
- **Media**: Expo ImagePicker

### Backend (API & Infrastructure)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Caching**: Cloudflare KV
- **Storage**: Cloudflare R2
- **Scheduled Jobs**: Cloudflare Cron Triggers
- **Authentication**: Supabase

### AI Integrations
- **Google Gemini API**: Motivational messages and summaries
- **DigitalOcean Gradient**: Analytics and insights

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Cloudflare account
- Supabase account
- Google Gemini API key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Cloudflare**:
   - Create a Cloudflare account
   - Get your Account ID from the dashboard
   - Create a D1 database: `wrangler d1 create gymbro-db`
   - Create KV namespace: `wrangler kv:namespace create "PUSH_TOKENS"`
   - Create R2 bucket: `wrangler r2 bucket create gymbro-images`

4. **Update wrangler.toml**:
   - Replace `your-database-id-here` with your actual D1 database ID
   - Replace `your-kv-namespace-id-here` with your KV namespace ID
   - Update other configuration values

5. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

6. **Deploy the database schema**:
   ```bash
   wrangler d1 migrations apply gymbro-db
   ```

7. **Deploy the Worker**:
   ```bash
   wrangler deploy
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a new Supabase project
   - Get your project URL and anon key
   - Update authentication settings to allow your domain

4. **Configure environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

5. **Start the development server**:
   ```bash
   npx expo start
   ```

6. **Run on device/simulator**:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## 📱 Features

### Core Features
- **Group Management**: Create/join workout groups (2-5 friends)
- **Daily Check-ins**: Photo or text updates
- **Streak Tracking**: Visual progress tracking
- **AI Motivation**: Personalized encouragement messages
- **Push Notifications**: Gentle reminders and updates
- **Social Feed**: See group members' progress

### API Endpoints

#### Authentication
- `POST /auth/link` - Link Supabase user to GymBro database
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

#### Groups
- `POST /groups` - Create a new group
- `GET /groups` - Get user's groups
- `GET /groups/:id` - Get group details
- `POST /groups/join` - Join group by invite code
- `DELETE /groups/:id/leave` - Leave group

#### Posts
- `POST /posts` - Create a new post
- `GET /posts/group/:groupId` - Get group posts
- `GET /posts/user` - Get user's posts
- `DELETE /posts/:id` - Delete post

#### Motivation
- `GET /motivate/group/:groupId` - Get motivational messages
- `POST /motivate/generate` - Generate custom message
- `GET /motivate/streaks/:groupId` - Get group streak summary

#### Notifications
- `POST /notify/register-token` - Register push token
- `DELETE /notify/unregister-token` - Unregister push token
- `GET /notify/settings` - Get notification settings

#### Upload
- `POST /upload/url` - Get upload URL for images
- `POST /upload/complete` - Complete multipart upload
- `GET /upload/user` - Get user's images
- `DELETE /upload/:fileName` - Delete image

## 🔧 Environment Variables

### Backend (.env)
```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

# Database Configuration
D1_DATABASE_ID=your-d1-database-id
D1_DATABASE_NAME=gymbro-db

# KV Namespace IDs
KV_PUSH_TOKENS_ID=your-kv-namespace-id

# R2 Configuration
R2_BUCKET_NAME=gymbro-images
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_PUBLIC_URL=https://your-r2-domain.com

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Services
GEMINI_API_KEY=your-google-gemini-api-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here

# Environment
ENVIRONMENT=development
```

### Frontend (.env)
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration
EXPO_PUBLIC_API_URL=https://your-worker-domain.workers.dev

# App Configuration
EXPO_PUBLIC_APP_NAME=GymBro
EXPO_PUBLIC_APP_VERSION=1.0.0

# Development
EXPO_PUBLIC_ENVIRONMENT=development
```

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
wrangler deploy
```

### Frontend Deployment
```bash
cd frontend
# Build for production
eas build --platform all
# Submit to app stores
eas submit --platform all
```

## 🧪 Development

### Running Tests
```bash
# Backend tests (when implemented)
cd backend && npm test

# Frontend tests (when implemented)
cd frontend && npm test
```

### Code Style
- TypeScript strict mode enabled
- ESLint configuration included
- Prettier formatting (when configured)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation

## 🔮 Future Enhancements

- [ ] Voice message support
- [ ] Workout plan sharing
- [ ] Integration with fitness trackers
- [ ] Advanced analytics
- [ ] Group challenges and competitions
- [ ] Meal planning integration
- [ ] Progress photos comparison
- [ ] Social features (likes, comments)
- [ ] Achievement badges
- [ ] Export data functionality