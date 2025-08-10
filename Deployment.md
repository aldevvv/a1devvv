# A1Dev Platform Deployment Guide

This guide will walk you through deploying the A1Dev platform to your VPS with domain `a1dev.id`.

## Prerequisites

- VPS running Ubuntu 20.04 or later
- Domain `a1dev.id` pointed to your VPS IP
- Root or sudo access to the VPS

## 1. Initial VPS Setup

### Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js (v18 or later)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install pnpm
```bash
npm install -g pnpm
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install Git
```bash
sudo apt install git -y
```

## 2. Database Setup

### Create PostgreSQL database and user
```bash
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE a1devdb;
CREATE USER a1devuser WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE a1devdb TO a1devuser;
\q
```

## 3. Clone and Setup Project

### Create application directory
```bash
sudo mkdir -p /var/www/a1dev
sudo chown $USER:$USER /var/www/a1dev
cd /var/www/a1dev
```

### Clone repository
```bash
git clone https://github.com/yourusername/a1dev-platform.git .
# Or if using SSH:
# git clone git@github.com:yourusername/a1dev-platform.git .
```

### Install dependencies
```bash
pnpm install
```

## 4. Environment Configuration

### Create production environment file for backend
```bash
cp backend/.env.example backend/.env.production
nano backend/.env.production
```

Update the environment variables:
```env
# Server Configuration
NODE_ENV=production
PORT=4000
FRONTEND_ORIGIN=https://a1dev.id

# Database
DATABASE_URL="postgresql://a1devuser:your_secure_password_here@localhost:5432/a1devdb"

# JWT Secrets (Generate new secure secrets)
JWT_ACCESS_SECRET=your_very_secure_access_secret_here
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Email Configuration (Update with your SMTP details)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
RESEND_API_KEY="your_resend_api_key"
EMAIL_FROM="A1Dev <noreply@a1dev.id>"

# OAuth Credentials (Update callback URLs)
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GITHUB_CALLBACK_URL="https://a1dev.id/api/auth/github/callback"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="https://a1dev.id/api/auth/google/callback"

# Xendit Configuration (Production Keys)
XENDIT_SECRET_KEY=xnd_production_your_production_key_here
XENDIT_WEBHOOK_TOKEN=your_webhook_token_here
XENDIT_BASE_URL=https://api.xendit.co

# App URLs
APP_URL=https://a1dev.id
API_URL=https://api.a1dev.id
```

### Create environment file for frontend
```bash
nano frontend/.env.production
```

```env
NEXT_PUBLIC_API_BASE=https://api.a1dev.id
NEXTAUTH_URL=https://a1dev.id
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## 5. Build Applications

### Build backend
```bash
cd backend
pnpm run build
```

### Generate Prisma client and run migrations
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

### Build frontend
```bash
cd frontend
pnpm run build
```

## 6. PM2 Configuration

### Create PM2 ecosystem file
```bash
nano /var/www/a1dev/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'a1dev-backend',
      cwd: '/var/www/a1dev/backend',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/www/a1dev/logs/backend-error.log',
      out_file: '/var/www/a1dev/logs/backend-out.log',
      log_file: '/var/www/a1dev/logs/backend-combined.log'
    },
    {
      name: 'a1dev-frontend',
      cwd: '/var/www/a1dev/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/www/a1dev/logs/frontend-error.log',
      out_file: '/var/www/a1dev/logs/frontend-out.log',
      log_file: '/var/www/a1dev/logs/frontend-combined.log'
    }
  ]
};
```

### Create logs directory
```bash
mkdir -p /var/www/a1dev/logs
```

### Start applications with PM2
```bash
cd /var/www/a1dev
pm2 start ecosystem.config.js
```

### Save PM2 configuration
```bash
pm2 save
pm2 startup
```

## 7. Nginx Configuration

### Create Nginx configuration for main site
```bash
sudo nano /etc/nginx/sites-available/a1dev.id
```

```nginx
server {
    listen 80;
    server_name a1dev.id www.a1dev.id;

    # Frontend - Next.js
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

    # Static files for Next.js
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### Create Nginx configuration for API subdomain
```bash
sudo nano /etc/nginx/sites-available/api.a1dev.id
```

```nginx
server {
    listen 80;
    server_name api.a1dev.id;

    # Backend - NestJS API
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

### Enable sites
```bash
sudo ln -s /etc/nginx/sites-available/a1dev.id /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.a1dev.id /etc/nginx/sites-enabled/
```

### Test Nginx configuration
```bash
sudo nginx -t
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

## 8. SSL Certificate (Let's Encrypt)

### Install Certbot
```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### Obtain SSL certificates
```bash
sudo certbot --nginx -d a1dev.id -d www.a1dev.id -d api.a1dev.id
```

Follow the prompts and choose to redirect HTTP to HTTPS.

### Setup auto-renewal
```bash
sudo crontab -e
```

Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## 9. Firewall Configuration

### Configure UFW firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 10. Domain DNS Configuration

Make sure your domain DNS has these records:

```
Type    Name        Value               TTL
A       @           YOUR_VPS_IP         300
A       www         YOUR_VPS_IP         300
A       api         YOUR_VPS_IP         300
```

## 11. Deployment Script

### Create deployment script for easy updates
```bash
nano /var/www/a1dev/deploy.sh
```

```bash
#!/bin/bash

echo "🚀 Starting A1Dev deployment..."

# Navigate to project directory
cd /var/www/a1dev

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
pnpm install

# Backend: Build and migrate
echo "🔨 Building backend..."
cd backend
pnpm run build
npx prisma generate
npx prisma migrate deploy
cd ..

# Frontend: Build
echo "🔨 Building frontend..."
cd frontend
pnpm run build
cd ..

# Restart applications
echo "🔄 Restarting applications..."
pm2 restart ecosystem.config.js

# Clear PM2 logs
pm2 flush

echo "✅ Deployment completed!"
echo "📊 Application status:"
pm2 status
```

### Make script executable
```bash
chmod +x /var/www/a1dev/deploy.sh
```

## 12. Production Checklist

### Security Updates
- [ ] Change all default passwords
- [ ] Generate secure JWT secrets
- [ ] Update OAuth callback URLs
- [ ] Use production Xendit API keys
- [ ] Configure proper SMTP settings
- [ ] Set up database backups
- [ ] Configure log rotation

### Testing
- [ ] Test frontend at https://a1dev.id
- [ ] Test API at https://api.a1dev.id
- [ ] Test authentication flows
- [ ] Test payment integration
- [ ] Test email functionality

### Monitoring
```bash
# Check application logs
pm2 logs

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check application status
pm2 status

# Monitor system resources
htop
```

## 13. Maintenance Commands

### Update application
```bash
/var/www/a1dev/deploy.sh
```

### Restart services
```bash
pm2 restart all
sudo systemctl restart nginx
```

### View logs
```bash
pm2 logs --lines 50
```

### Check SSL certificate status
```bash
sudo certbot certificates
```

### Backup database
```bash
pg_dump -h localhost -U a1devuser a1devdb > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🎉 Deployment Complete!

Your A1Dev platform should now be running at:
- **Frontend:** https://a1dev.id
- **API:** https://api.a1dev.id

Make sure to test all functionality and monitor the logs for any issues.