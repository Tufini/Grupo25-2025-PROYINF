#!/bin/sh
set -e

echo "⏳ Waiting for Postgres..."
npx wait-port postgres_db:5432

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building client..."
npm run build:client

echo "🔄 Running migrations..."
npm run migrate

echo "🚀 Starting application..."
exec npm start
