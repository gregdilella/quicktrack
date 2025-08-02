# 🔒 Security Setup Guide

## ⚠️ URGENT: Security Vulnerabilities Fixed

**IMPORTANT**: Hardcoded secrets were found and removed from your repository. Follow this guide to set up secure environment variables.

## 1. Local Development (.env file)

Create a `.env` file in your project root with your actual values:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://lcmdqkodmwbygnplmhlg.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Flight APIs
AVIATIONSTACK_API_KEY=your-aviationstack-api-key
AMADEUS_CLIENT_ID=your-amadeus-client-id
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret
```

## 2. Cloudflare Pages/Workers Deployment

For production deployment, set environment variables via:

### Option A: Cloudflare Dashboard
1. Go to your Cloudflare Pages project
2. Settings → Environment Variables
3. Add each variable for "Production" and "Preview" environments

### Option B: Wrangler CLI
```bash
# Set secrets (recommended for sensitive values)
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put AVIATIONSTACK_API_KEY
wrangler secret put AMADEUS_CLIENT_SECRET

# Set regular environment variables
wrangler vars set PUBLIC_SUPABASE_URL "https://your-project.supabase.co"
wrangler vars set PUBLIC_SUPABASE_ANON_KEY "your-anon-key"
wrangler vars set AMADEUS_CLIENT_ID "your-client-id"
```

## 3. 🚨 IMMEDIATE ACTION REQUIRED

### Supabase Security
1. **Go to your Supabase dashboard immediately**
2. **Regenerate your anon key** (the old one was exposed)
3. **Regenerate your service role key** (for safety)
4. Update your `.env` file with the new keys

### AviationStack API
1. **Log into your AviationStack account**
2. **Regenerate your API key** (the old one was exposed: `1caae288d9c0e6598ecd439afecf8119`)
3. Update your `.env` file with the new key

## 4. Verify .gitignore

The `.gitignore` file correctly excludes `.env` files:
```
.env
.env.*
!.env.example
!.env.test
```

## 5. Session Persistence Status ✅

**Good news**: Your session management is properly implemented!

Your app correctly:
- Stores JWT tokens in secure HTTP cookies
- Auto-refreshes tokens when needed
- Handles invalid/expired tokens gracefully
- Maintains sessions across browser visits
- Clears tokens on logout

### Session Features:
- **7-day cookie expiration** for persistent login
- **Automatic token refresh** to keep users logged in
- **Secure cookie settings** (SameSite, Secure for HTTPS)
- **Server-side session validation** in `hooks.server.ts`
- **Periodic auth checks** every 10 minutes in protected routes

## 6. Best Practices Going Forward

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** (especially after exposure)
4. **Use different keys** for development/production
5. **Monitor for exposed secrets** in your repository

## 7. Testing Your Setup

After updating environment variables:

```bash
# Start development server
bun run dev

# Test authentication by:
# 1. Signing in to your app
# 2. Closing browser
# 3. Reopening - you should stay logged in
# 4. Check browser cookies for 'sb-access-token' and 'sb-refresh-token'
```

---

**Remember**: The exposed keys have been removed from the code, but they were already committed to Git history. Consider rotating all keys immediately for maximum security. 