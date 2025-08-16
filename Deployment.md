# A1Dev Platform Deployment Guide

Simple deployment guide for A1Dev platform to VPS with domain `a1dev.id`.

## Prerequisites

- VPS running Ubuntu 20.04 or later
- Domain `a1dev.id` pointed to your VPS IP
- Supabase database already setup

## 1. VPS Initial Setup

### Update system and install required packages
```bash
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm, PM2, Nginx, Git
npm install -g pnpm pm2
sudo apt install nginx git -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 2. Clone and Setup Project

### Clone repository to root directory
```bash
cd /root
git clone https://github.com/yourusername/a1dev-platform.git a1dev
cd a1dev

# Install all dependencies
pnpm install
```

## 3. Environment Configuration

### Backend environment
```bash
nano backend/.env
```

```env
NODE_ENV=production
PORT=4000
FRONTEND_ORIGIN=https://a1dev.id

# Your Supabase Database URL
DATABASE_URL="your_supabase_database_url_here"

# Generate secure secrets
JWT_ACCESS_SECRET=your_secure_access_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Email settings
RESEND_API_KEY="your_resend_api_key"
EMAIL_FROM="A1Dev <noreply@a1dev.id>"

# OAuth (update callback URLs to production)
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GITHUB_CALLBACK_URL="https://a1dev.id/api/auth/github/callback"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="https://a1dev.id/api/auth/google/callback"

# Xendit production keys
XENDIT_SECRET_KEY=xnd_production_your_key_here
XENDIT_WEBHOOK_TOKEN=your_webhook_token
XENDIT_BASE_URL=https://api.xendit.co

# App URLs
APP_URL=https://a1dev.id
API_URL=https://api.a1dev.id
```

### Frontend environment
```bash
nano frontend/.env
```

```env
NEXT_PUBLIC_API_BASE=https://api.a1dev.id
NEXTAUTH_URL=https://a1dev.id
NEXTAUTH_SECRET=your_nextauth_secret
```

## 4. Build and Deploy

### Build applications
```bash
# Backend: Generate Prisma client first, then build
cd backend
npx prisma generate
npx prisma migrate deploy
pnpm run build
cd ..

# Build frontend
cd frontend
pnpm run build
cd ..
```

### Create PM2 ecosystem file (di folder project utama)
```bash
cd /root/a1devvv
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'a1dev-backend',
      cwd: '/root/a1devvv/backend',
      script: 'dist/main.js',
      env: { NODE_ENV: 'production', PORT: 4000 },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'a1dev-frontend',
      cwd: '/root/a1devvv/frontend',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3000 },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

### Start with PM2 (dari folder project utama)
```bash
cd /root/a1devvv
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 5. Nginx Configuration

### Main site configuration
```bash
sudo nano /etc/nginx/sites-available/a1dev.id
```

```nginx
server {
    listen 80;
    server_name a1dev.id www.a1dev.id;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### API subdomain configuration
```bash
sudo nano /etc/nginx/sites-available/api.a1dev.id
```

```nginx
server {
    listen 80;
    server_name api.a1dev.id;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable sites and restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/a1dev.id /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.a1dev.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. SSL Certificate

### Install and configure SSL
```bash
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get certificates
sudo certbot --nginx -d a1dev.id -d www.a1dev.id -d api.a1dev.id

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 7. Firewall & DNS

### Firewall setup
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### DNS Records needed
```
A    @      YOUR_VPS_IP
A    www    YOUR_VPS_IP
A    api    YOUR_VPS_IP
```

## 8. Easy Deploy Script

### Create update script (di folder project utama)
```bash
cd /root/a1devvv
nano deploy.sh
```

```bash
#!/bin/bash
cd /root/a1devvv
git pull origin main
pnpm install

cd backend
npx prisma generate
npx prisma migrate deploy
pnpm run build
cd ..

cd frontend
pnpm run build
cd ..

pm2 restart ecosystem.config.js
echo "✅ Deployment completed!"
```

```bash
cd /root/a1devvv
chmod +x deploy.sh
```

## 9. Handling Updates

### Database Schema Updates

When you have database schema changes:

```bash
cd /root/a1devvv
git pull origin main

# Generate new Prisma client and run migrations
cd backend
npx prisma generate
npx prisma migrate deploy
pnpm run build

# Restart the backend service
pm2 restart a1dev-backend
```

### Backend Code Updates

When you only have backend code changes (no schema changes):

```bash
cd /root/a1devvv
git pull origin main

# Install any new dependencies
pnpm install

# Rebuild the backend
cd backend
pnpm run build

# Restart the backend service
pm2 restart a1dev-backend
```

### Frontend Code Updates

When you only have frontend code changes:

```bash
cd /root/a1devvv
git pull origin main

# Install any new dependencies
pnpm install

# Rebuild the frontend
cd frontend
pnpm run build

# Restart the frontend service
pm2 restart a1dev-frontend
```

### Full Stack Updates

When you have changes across the entire stack (frontend, backend, and database):

```bash
cd /root/a1devvv
git pull origin main

# Install any new dependencies
pnpm install

# Update database and rebuild backend
cd backend
npx prisma generate
npx prisma migrate deploy
pnpm run build
cd ..

# Rebuild frontend
cd frontend
pnpm run build
cd ..

# Restart all services
pm2 restart all
```

### Database Seeding (if needed)

If you need to seed the database with initial data:

```bash
cd /root/a1devvv/backend
npx prisma db seed
```

## 🎉 Done!

Your A1Dev platform will be live at:
- **Frontend:** https://a1dev.id
- **API:** https://api.a1dev.id

### Quick Commands:
- **Deploy updates:** `/root/a1devvv/deploy.sh`
- **Check status:** `pm2 status`
- **View logs:** `pm2 logs`
- **Restart:** `pm2 restart all`
- **Update database only:** `cd /root/a1devvv/backend && npx prisma migrate deploy`
