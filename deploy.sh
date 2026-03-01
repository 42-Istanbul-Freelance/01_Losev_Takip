#!/bin/bash

# LÖSEV İnci Takip Sistemi - Production Deploy Script
set -e

echo "🚀 LÖSEV İnci - Production Deployment"
echo "========================================"

# Git pull
echo "📥 Pulling latest changes..."
git pull origin main

# Build and deploy
echo "🐳 Building Docker images..."
docker-compose -f docker-compose.prod.yml down
docker rmi $(docker images -q 01_losev_takip-app) 2>/dev/null || true
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for app to be ready
echo "⏳ Waiting for app to start..."
sleep 5

# Create admin user if not exists
echo "👤 Creating admin users..."
curl -s -X POST http://localhost:4000/api/headoffice/register \
  -H "Content-Type: application/json" \
  -d '{"email":"gm@losev.org","password":"losev2024","firstName":"Genel","lastName":"Merkez"}' || true

curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"role":"teacher","email":"admin@test.com","password":"admin123","firstName":"Test","lastName":"Admin","schoolName":"Test Okulu"}' || true

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application is running at: http://localhost"
echo ""
echo "Login URLs:"
echo "  - http://localhost/login.html (Öğrenci/Öğretmen)"
echo "  - Select 'Genel Merkez' for admin access"
echo ""
echo "Test Credentials:"
echo "  Genel Merkez: gm@losev.org / losev2024"
echo "  Öğretmen: admin@test.com / admin123"
