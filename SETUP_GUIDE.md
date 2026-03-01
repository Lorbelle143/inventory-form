# Setup Guide - Student Inventory System

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Google Cloud account (for Google Forms API)

## Step 1: Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Get your project credentials:
   - Go to Settings > API
   - Copy the Project URL and anon/public key

## Step 2: Google Forms Setup

### Create the Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Create a new form with these fields:
   - Student ID (Short answer)
   - Full Name (Short answer)
   - Course (Short answer)
   - Year Level (Dropdown: 1st, 2nd, 3rd, 4th)
   - Contact Number (Short answer)
   - Address (Short answer)
   - Emergency Contact Name (Short answer)
   - Emergency Contact Number (Short answer)
   - Photo URL (Short answer - will be auto-filled)

3. Get the Form ID from the URL:
   - URL format: `https://docs.google.com/forms/d/{FORM_ID}/edit`

### Enable Google Forms API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Forms API
4. Create credentials (API Key)
5. Copy the API key

## Step 3: Environment Configuration

1. Copy `.env.example` to `.env`
2. Fill in your credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_FORMS_API_KEY=your_google_api_key
VITE_GOOGLE_FORM_ID=your_google_form_id
VITE_ADMIN_MASTER_KEY=create_a_secure_password
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Create Admin Account

1. Start the development server:
```bash
npm run dev
```

2. Register a new account
3. Go to Supabase Dashboard > Table Editor > profiles
4. Find your account and set `is_admin` to `true`

## Step 6: Test the System

### Student Flow:
1. Register as a student
2. Login with student credentials
3. Fill out the inventory form with photo upload
4. View submission in dashboard

### Admin Flow:
1. Login with admin credentials + master key
2. View all student submissions
3. Export data to CSV
4. Check Google Sheets for synced data

## Google Sheets Integration

The form responses will automatically sync to Google Sheets:

1. Open your Google Form
2. Click "Responses" tab
3. Click the Google Sheets icon to create linked spreadsheet
4. All submissions will appear here automatically

## Customization

### Branding
- Update colors in `tailwind.config.js`
- Add logo in `src/assets/`
- Modify theme in component files

### Form Fields
- Edit `src/pages/InventoryForm.tsx`
- Update database schema in `supabase/schema.sql`
- Modify Google Form to match

## Troubleshooting

### Photo Upload Issues
- Check Supabase Storage bucket is public
- Verify storage policies are correct
- Ensure file size is under 5MB

### Authentication Issues
- Verify Supabase credentials in `.env`
- Check email confirmation settings in Supabase
- Ensure RLS policies are enabled

### Google Forms Integration
- Verify API key is valid
- Check Form ID is correct
- Ensure Forms API is enabled in Google Cloud

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to hosting service (Vercel, Netlify, etc.)
3. Set environment variables in hosting platform
4. Update Supabase URL whitelist for production domain

## Security Notes

- Never commit `.env` file
- Use strong master key for admin access
- Enable email verification in Supabase
- Regularly backup database
- Monitor storage usage
