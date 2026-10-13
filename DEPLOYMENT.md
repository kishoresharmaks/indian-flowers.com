# AlmaLinux 9.5 + CyberPanel / OpenLiteSpeed Deployment Guide

This guide details the complete production setup for **Indian-Flowers.com** on an **AlmaLinux 9.5** VPS running **CyberPanel** with **OpenLiteSpeed**, **Node.js (v22)**, and **PM2**.

---

## 1. Architecture Overview

```text
       DNS (A Record) ──▶ VPS Public IP
                               │
                               ▼
               CyberPanel / OpenLiteSpeed (Port 80/443, SSL)
                               │
               ┌───────────────┴───────────────┐
               │ Reverse Proxy (.htaccess)     │
               ▼                               ▼
       Next.js Storefront & API            (Optional) NestJS Backend
       Port 3000 (PM2 Managed)             Port 4000 (PM2 Managed)
```

> **Note on NestJS:** The current repository `nexus-ecomm-cms` is a complete fullstack Next.js application containing both the frontend and all API endpoints (`/api/*`). If you are running `nexus-ecomm-cms` standalone, only port 3000 is needed. If you also deploy a separate NestJS backend, it will run on port 4000 alongside Next.js.

---

## 2. Server Prerequisites (Already Verified)

- **OS:** AlmaLinux 9.5 (Teal Serval)
- **Node.js:** v22.x
- **npm:** v10.x / **pnpm:** v12.x
- **PM2:** v7.x
- **CyberPanel with OpenLiteSpeed**

---

## 3. Step-by-Step Setup

### Step 3.1: Create Website in CyberPanel
1. Log in to your CyberPanel admin console (usually `https://YOUR_VPS_IP:8090`).
2. Navigate to **Websites** ➔ **Create Website**.
3. Choose/Enter:
   - **Package:** Default
   - **Owner:** admin (or your preferred user)
   - **Domain Name:** `indian-flowers.com` (or your subdomain / domain)
   - **Email:** `krishkishoreks@gmail.com`
   - **PHP Version:** PHP 8.1 / 8.2 (default is fine, we are proxying to Node.js)
   - Check **SSL** (Let's Encrypt), **DKIM**, and **open_basedir**.
4. Click **Create Website**.

The website document root is located at:
```bash
/home/indian-flowers.com/public_html
```

---

### Step 3.2: Clone or Upload the Code
From your AlmaLinux root shell (`[root@srv672531 home]#`):

```bash
# Switch to the website directory
cd /home/indian-flowers.com/public_html

# If pulling from Git:
git clone https://github.com/kishoresharmaks/nexus-ecomm-cms.git .

# OR if uploading via SFTP / SCP / rsync, copy the files directly here.
```

---

### Step 3.3: Set Up Environment Variables (`.env.local`)
Create or edit `.env.local` inside `/home/indian-flowers.com/public_html`:

```bash
nano /home/indian-flowers.com/public_html/.env.local
```

Paste your configuration:
```env
MONGODB_URI="mongodb+srv://vsgroupstn_db_user:lSQc7rLGwXmgNUOu@beeshhub.qpl5cic.mongodb.net/nexusdemousd?retryWrites=true&w=majority&appName=beeshub"
AUTH_SECRET=yZIMNIuC2ow_xEIXdhriREr8NlYIuTB0y_dcA5_nZug

# SAAS LICENSING & SUBSCRIPTION CONFIG
LICENSING_SERVER_URL=https://lic.nexusnation.in
NEXT_PUBLIC_LICENSING_SERVER_URL=https://lic.nexusnation.in

# Store details (USD)
STORE_NAME="Indian Flowers"
BUSINESS_NAME="Indian Flowers US"
STORE_DOMAIN="indian-flowers.com"
STORE_CONTACT_EMAIL="krishkishoreks@gmail.com"
STORE_CONTACT_PHONE=""
STORE_CURRENCY="USD"
STORE_LOCALE="en-US"
STORE_TIMEZONE="America/New_York"
PORT=3000
```

---

### Step 3.4: Install Dependencies & Build Next.js

```bash
cd /home/indian-flowers.com/public_html

# Install dependencies
npm ci
# or if using pnpm:
# pnpm install

# Build the Next.js production build
npm run build
```

---

### Step 3.5: Configure PM2 & Process Startup

Use the provided `ecosystem.config.js`:

```bash
cd /home/indian-flowers.com/public_html

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to automatically start on server reboot:
pm2 startup
# (Run the sudo env PATH=... command that PM2 outputs if prompted)
```

Verify the app is running locally:
```bash
pm2 status
curl -I http://127.0.0.1:3000
```

---

### Step 3.6: Configure OpenLiteSpeed Reverse Proxy (`.htaccess`)

CyberPanel reads `.htaccess` in `/home/indian-flowers.com/public_html/.htaccess`.

Make sure `.htaccess` contains the following:

#### Scenario A: Next.js All-in-One (Current Setup - Port 3000)
```apache
DirectoryIndex disabled

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # WebSocket Support
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^(.*)$ ws://127.0.0.1:3000/$1 [P,L]

    # Reverse Proxy to Next.js on Port 3000
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>

<IfModule mod_headers.c>
    Header set X-Forwarded-Proto "https"
    Header set X-Forwarded-Port "443"
</IfModule>
```

#### Scenario B: Next.js (Port 3000) + NestJS Backend (Port 4000)
If you run an independent NestJS backend on port 4000:
```apache
DirectoryIndex disabled

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Route /api calls to NestJS on port 4000
    RewriteRule ^api/(.*)$ http://127.0.0.1:4000/api/$1 [P,L]

    # WebSocket Support to Next.js
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^(.*)$ ws://127.0.0.1:3000/$1 [P,L]

    # All other routes to Next.js on port 3000
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>

<IfModule mod_headers.c>
    Header set X-Forwarded-Proto "https"
    Header set X-Forwarded-Port "443"
</IfModule>
```

---

### Step 3.7: Fix Permissions & Restart Web Server

Ensure OpenLiteSpeed user permissions are correct:

```bash
# Set proper ownership for the website user (replace yourdomain_user with your CyberPanel website user)
chown -R indianflowers:indianflowers /home/indian-flowers.com/public_html

# Restart OpenLiteSpeed server
systemctl restart lsws
```

---

## 4. Useful Management Commands

| Action | Command |
| :--- | :--- |
| **Check PM2 Status** | `pm2 status` |
| **View App Logs** | `pm2 logs nexus-ecomm-cms` |
| **Restart App** | `pm2 restart nexus-ecomm-cms` |
| **Restart Web Server** | `systemctl restart lsws` |
| **Test Local Response** | `curl -I http://127.0.0.1:3000` |
