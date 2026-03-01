# Quick Deploy to Vercel - 5 Minutes

## Option 1: Deploy via Vercel Website (Easiest)

### Step 1: Push to GitHub (2 minutes)
```bash
git init
git add .
git commit -m "Student Inventory System"
```

Then create a new repository on GitHub and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel (3 minutes)

1. Go to **https://vercel.com/new**
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Add these Environment Variables:
   ```
   VITE_SUPABASE_URL = (from Supabase Dashboard → Settings → API)
   VITE_SUPABASE_ANON_KEY = (from Supabase Dashboard → Settings → API)
   VITE_ADMIN_MASTER_KEY = (create a strong password for admin)
   ```
5. Click "Deploy"
6. Wait 2-3 minutes ✅

### Step 3: Update Supabase (1 minute)

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL:
   - Site URL: `https://your-project.vercel.app`
   - Redirect URLs: `https://your-project.vercel.app/**`

### Done! 🎉

Visit your Vercel URL and test the app.

---

## Option 2: Deploy via Vercel CLI (For Developers)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and add environment variables when asked

# Deploy to production
vercel --prod
```

---

## What You Need Ready

Before deploying, have these ready:

1. **Supabase Project URL**
   - Dashboard → Settings → API → Project URL
   - Example: `https://xxxxx.supabase.co`

2. **Supabase Anon Key**
   - Dashboard → Settings → API → Project API keys → anon/public
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Admin Master Key**
   - Create a strong password
   - Example: `Admin@NBSC2024!`
   - This is what admins will use to login

---

## After Deployment Checklist

- [ ] Visit your Vercel URL
- [ ] Test student registration
- [ ] Test student login
- [ ] Test admin login (use master key)
- [ ] Upload a test photo
- [ ] Test document scanner
- [ ] Test admin dashboard CRUD

---

## Automatic Updates

Every time you push to GitHub, Vercel automatically redeploys:

```bash
# Make changes to your code
git add .
git commit -m "Updated feature"
git push

# Vercel automatically deploys! 🚀
```

---

## Need Help?

Check the full guide: `VERCEL_DEPLOYMENT.md`
