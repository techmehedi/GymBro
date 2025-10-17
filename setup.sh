#!/bin/bash

echo "🏋️ Peer Fitness Network Setup Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "peer-fitness/package.json" ] || [ ! -f "fitness-worker/package.json" ]; then
    echo "❌ Please run this script from the GymBro project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install frontend dependencies
echo "Installing Expo app dependencies..."
cd peer-fitness
npm install
cd ..

# Install backend dependencies
echo "Installing Cloudflare Worker dependencies..."
cd fitness-worker
npm install
cd ..

echo "✅ Dependencies installed successfully!"

echo ""
echo "🔧 Next steps:"
echo "1. Set up your environment variables:"
echo "   - Copy env.example to .env in peer-fitness/"
echo "   - Update wrangler.toml in fitness-worker/ with your Cloudflare credentials"
echo ""
echo "2. Set up Cloudflare services:"
echo "   cd fitness-worker"
echo "   npx wrangler d1 create peer-fitness-db"
echo "   npx wrangler r2 bucket create peer-fitness-images"
echo "   npx wrangler kv:namespace create KV"
echo ""
echo "3. Apply database schema:"
echo "   npx wrangler d1 migrations apply peer-fitness-db"
echo ""
echo "4. Start development:"
echo "   # Terminal 1 - Backend"
echo "   cd fitness-worker && npm run dev"
echo ""
echo "   # Terminal 2 - Frontend"
echo "   cd peer-fitness && npm start"
echo ""
echo "🎉 Happy coding! Check the README.md for detailed setup instructions."
