# Deployment Checklist ✅

Use this checklist to deploy your Student Inventory System to Vercel.

## Before You Start

- [ ] You have a GitHub account
- [ ] You have a Vercel account (sign up at vercel.com)
- [ ] Your Supabase project is set up and working locally
- [ ] You have tested the app locally with `npm run dev`

---

## Step 1: Prepare Your Code

- [ ] All files are saved
- [ ] `.env` file is in `.gitignore` (already done ✅)
- [ ] You have your Supabase credentials ready

**Get Supabase Credentials:**
1. Go to Supabase Dashboard
2. Click Settings → API
3. Copy these values:
   - [ ] Project URL (starts with `https://`)
   - [ ] anon/public key (long string starting with `eyJ`)

**Create Admin Master Key:**
- [ ] Choose a strong password (e.g., `Admin@NBSC2024!`)
- [ ] Write it down securely

---

## Step 2: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Student Inventory System"
```

**Create GitHub Repository:**
1. Go to https://github.com/new
2. Repository name: `student-inventory-system` (or your choice)
3. Make it Private or Public
4. Don't initialize with README (you already have one)
5. Click "Create repository"

**Push to GitHub:**
```bash
# Replace with your actual GitHub username and repo name
git remote add origin https://github.com/YOUR_USERNAME/student-inventory-system.git
git branch -M main
git push -u origin main
```

- [ ] Code is pushed to GitHub
- [ ] You can see your files on GitHub

---

## Step 3: Deploy to Vercel

1. **Go to Vercel**
   - [ ] Visit https://vercel.com/new
   - [ ] Log in with GitHub

2. **Import Repository**
   - [ ] Click "Import Git Repository"
   - [ ] Select `student-inventory-system` repository
   - [ ] Click "Import"

3. **Configure Project**
   - [ ] Framework Preset: Vite (should auto-detect)
   - [ ] Build Command: `npm run build` (should auto-fill)
   - [ ] Output Directory: `dist` (should auto-fill)

4. **Add Environment Variables**
   
   Click "Environment Variables" and add these 3 variables:
   
   - [ ] `VITE_SUPABASE_URL`
     - Value: Your Supabase Project URL
     - Example: `https://xxxxxxxxxxxxx.supabase.co`
   
   - [ ] `VITE_SUPABASE_ANON_KEY`
     - Value: Your Supabase anon/public key
     - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   
   - [ ] `VITE_ADMIN_MASTER_KEY`
     - Value: Your chosen admin password
     - Example: `Admin@NBSC2024!`

5. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait 2-3 minutes for build to complete
   - [ ] You'll see "Congratulations!" when done

6. **Copy Your URL**
   - [ ] Copy your Vercel URL (e.g., `https://student-inventory-system.vercel.app`)

---

## Step 4: Update Supabase Settings

1. **Go to Supabase Dashboard**
   - [ ] Open your Supabase project

2. **Update Authentication URLs**
   - [ ] Go to Authentication → URL Configuration
   - [ ] Site URL: Paste your Vercel URL
   - [ ] Redirect URLs: Add `https://your-vercel-url.vercel.app/**`
   - [ ] Click "Save"

3. **Verify Storage Bucket**
   - [ ] Go to Storage
   - [ ] Verify `student-photos` bucket exists
   - [ ] Verify it's set to Public
   - [ ] Check file size limit is 5MB

---

## Step 5: Test Your Deployment

Visit your Vercel URL and test:

### Student Flow
- [ ] Can access the site
- [ ] Can register a new student account
- [ ] Can login with Student ID + Password
- [ ] Can access student dashboard
- [ ] Can fill out inventory form
- [ ] Can upload 2x2 photo
- [ ] Can scan/upload 4 documents
- [ ] Can submit form successfully

### Admin Flow
- [ ] Can access admin login
- [ ] Can login with master key
- [ ] Can see "Total Students" card
- [ ] Can see "Total Submissions" card
- [ ] Can click cards to switch views
- [ ] Can search for students
- [ ] Can view student details
- [ ] Can see uploaded documents
- [ ] Can edit student records
- [ ] Can delete student records
- [ ] Can export to CSV

---

## Step 6: Share Your App

Your app is now live! Share the URL:

- **Student URL**: `https://your-project.vercel.app/register`
- **Admin URL**: `https://your-project.vercel.app/login` (then click Admin tab)

- [ ] Share URL with students
- [ ] Share admin credentials with authorized staff
- [ ] Add URL to school website/portal

---

## Troubleshooting

### Build Failed
- Check Vercel deployment logs
- Verify all dependencies are in `package.json`
- Make sure environment variables are set correctly

### Can't Login
- Check environment variables are set in Vercel
- Verify Supabase redirect URLs include your Vercel URL
- Check browser console for errors

### Photos Not Uploading
- Verify storage bucket `student-photos` exists
- Check bucket is set to Public
- Verify storage policies allow uploads

### Admin Login Not Working
- Verify `VITE_ADMIN_MASTER_KEY` is set in Vercel
- Use exact same password you set in environment variables
- Check for typos

---

## Future Updates

To update your deployed app:

```bash
# Make changes to your code
git add .
git commit -m "Description of changes"
git push
```

Vercel will automatically redeploy! 🚀

---

## Optional: Custom Domain

Want to use your own domain (e.g., `inventory.nbsc.edu.ph`)?

1. Go to Vercel project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with new domain

---

## Need Help?

- Check full guide: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- Check Vercel docs: https://vercel.com/docs
- Check Supabase docs: https://supabase.com/docs

---

## Congratulations! 🎉

Your Student Inventory Management System is now live and accessible to students and staff!
