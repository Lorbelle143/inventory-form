# Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GOOGLE_FORMS_API_KEY`
   - `VITE_GOOGLE_FORM_ID`
   - `VITE_ADMIN_MASTER_KEY`
5. Deploy

### Option 2: Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. New site from Git
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variables in Site settings

### Option 3: Self-Hosted

```bash
# Build the project
npm run build

# Serve with any static file server
npx serve dist -p 3000
```

## Post-Deployment Checklist

- [ ] Update Supabase URL whitelist
- [ ] Test student registration
- [ ] Test admin login with master key
- [ ] Verify photo uploads work
- [ ] Check Google Forms integration
- [ ] Test CSV export
- [ ] Verify responsive design on mobile
- [ ] Set up SSL certificate
- [ ] Configure custom domain

## Performance Optimization

1. Enable Vercel/Netlify CDN
2. Configure image optimization
3. Enable compression
4. Set up caching headers

## Monitoring

- Set up Supabase monitoring
- Enable error tracking (Sentry)
- Monitor storage usage
- Track API rate limits
