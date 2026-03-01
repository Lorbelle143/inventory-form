# Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier is fine)
- Supabase project already set up

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

First, initialize git and push to GitHub if you haven't already:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Student Inventory System"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Log In" (use GitHub account for easy integration)
3. Click "Add New Project"
4. Import your GitHub repository
5. Select the repository you just pushed

### 3. Configure Build Settings

Vercel should auto-detect Vite settings, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Add Environment Variables

Click "Environment Variables" and add these:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_MASTER_KEY=your_admin_master_key
```

**Where to find Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

**For Admin Master Key:**
- Use a strong password (e.g., `Admin@NBSC2024!`)
- This is what admins will use to log in

### 5. Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://your-project.vercel.app`

### 6. Configure Supabase for Production

After deployment, update Supabase settings:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: `https://your-project.vercel.app/**`

3. Go to Storage → Policies
4. Verify storage bucket `student-photos` exists and is public

### 7. Test Your Deployment

Visit your Vercel URL and test:
- [ ] Student registration works
- [ ] Student login works
- [ ] Admin login works (use master key)
- [ ] Photo upload works
- [ ] Document scanner works
- [ ] Admin dashboard CRUD operations work

## Updating Your Deployment

Every time you push to GitHub, Vercel will automatically redeploy:

```bash
git add .
git commit -m "Your update message"
git push
```

## Custom Domain (Optional)

To use your own domain:

1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., `inventory.nbsc.edu.ph`)
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with your custom domain

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Make sure environment variables are set

### Environment Variables Not Working
- Variable names must start with `VITE_`
- Redeploy after adding/changing variables
- Check browser console for errors

### Supabase Connection Issues
- Verify environment variables are correct
- Check Supabase project is not paused (free tier pauses after inactivity)
- Verify redirect URLs in Supabase settings

### Photos Not Uploading
- Check storage bucket exists: `student-photos`
- Verify bucket is public
- Check storage policies allow uploads

### Admin Login Not Working
- Verify `VITE_ADMIN_MASTER_KEY` environment variable is set
- Check you're using the exact same key in login

## Environment Variables Reference

Create a `.env.production` file locally for reference (don't commit):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ADMIN_MASTER_KEY=YourSecureAdminPassword123!
```

## Vercel CLI (Alternative Method)

You can also deploy using Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_ADMIN_MASTER_KEY

# Deploy to production
vercel --prod
```

## Performance Tips

1. **Enable Vercel Analytics** (optional)
   - Go to project → Analytics
   - Enable Web Analytics

2. **Enable Vercel Speed Insights** (optional)
   - Go to project → Speed Insights
   - Enable Speed Insights

3. **Optimize Images**
   - Consider using Vercel Image Optimization
   - Compress photos before upload

## Security Checklist

- [x] Environment variables are set in Vercel (not in code)
- [x] `.env` file is in `.gitignore`
- [x] Supabase RLS policies are configured
- [x] Admin master key is strong
- [x] HTTPS is enabled (automatic with Vercel)
- [x] Supabase redirect URLs are configured

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Supabase connection
4. Check environment variables are set correctly

## Cost

- **Vercel**: Free tier includes:
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic HTTPS
  - Custom domains

- **Supabase**: Free tier includes:
  - 500MB database
  - 1GB file storage
  - 50,000 monthly active users
  - 2GB bandwidth

Both free tiers should be sufficient for a school inventory system.
