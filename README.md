# Student Inventory Management System

Northern Bukidnon State College - Guidance and Counseling Office

A comprehensive student inventory system with document scanning, photo uploads, and role-based dashboards.

## Features

### For Students
- ✅ Registration with Student ID
- ✅ Login with Student ID + Password
- ✅ Multi-section inventory form (Basic Info, Family Background, Interests & Health)
- ✅ 2x2 Photo upload
- ✅ Document scanner (scan/photograph 4 required documents)
- ✅ Mobile-friendly camera access
- ✅ Student dashboard

### For Admin
- ✅ Master key authentication (no database account needed)
- ✅ View all registered students
- ✅ View all inventory submissions
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Search by name, student ID, or email
- ✅ Sort by last name or date
- ✅ Export to CSV
- ✅ 4-column grid layout with photos
- ✅ View uploaded documents

### Required Documents (Students scan/photograph)
1. WHODAS 2.0 Form
2. Individual Inventory Form
3. PID-5-BF Form
4. Counseling Consent Form

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **File Upload**: Supabase Storage
- **Deployment**: Vercel

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd student-inventory-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ADMIN_MASTER_KEY=your_admin_password
   ```

4. **Set up Supabase database**
   
   Run the SQL script in Supabase SQL Editor:
   ```bash
   supabase/COMPLETE_SETUP.sql
   ```

5. **Create storage bucket**
   
   In Supabase Dashboard → Storage:
   - Create bucket: `student-photos`
   - Make it public
   - Set 5MB file size limit

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open browser**
   ```
   http://localhost:5173
   ```

## Deploy to Vercel

### Quick Deploy (5 minutes)

See detailed guide: **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)**

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Full Deployment Guide

See: **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)**

## Project Structure

```
├── src/
│   ├── components/
│   │   └── DocumentScanner.tsx    # Document scanning component
│   ├── lib/
│   │   └── supabase.ts            # Supabase client
│   ├── pages/
│   │   ├── Login.tsx              # Student/Admin login
│   │   ├── Register.tsx           # Student registration
│   │   ├── StudentDashboard.tsx   # Student dashboard
│   │   ├── AdminDashboard.tsx     # Admin CRUD dashboard
│   │   └── InventoryForm.tsx      # Multi-section form
│   ├── store/
│   │   └── authStore.ts           # Auth state management
│   └── App.tsx                    # Main app component
├── supabase/
│   └── COMPLETE_SETUP.sql         # Database setup script
├── vercel.json                    # Vercel configuration
└── package.json
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGci...` |
| `VITE_ADMIN_MASTER_KEY` | Admin login password | `Admin@NBSC2024!` |

## User Roles

### Student
- Login: Student ID + Password
- Can register, fill inventory form, upload documents
- View their own submissions

### Admin
- Login: Master Key only (no email/password)
- Full access to all student records
- CRUD operations on inventory submissions
- Export data to CSV
- View all uploaded documents

## Database Schema

### Tables
- `profiles` - Student profiles (id, email, full_name, student_id)
- `inventory_submissions` - Form submissions with JSONB data

### Storage
- `student-photos` - Student photos and scanned documents

## Documentation

- [Features Overview](FEATURES.md)
- [Form Structure](FORM_STRUCTURE.md)
- [Document Scanner](DOCUMENT_SCANNER_FEATURE.md)
- [Supabase Setup](SUPABASE_SETUP.md)
- [Deployment Guide](VERCEL_DEPLOYMENT.md)
- [Quick Deploy](QUICK_DEPLOY.md)

## Troubleshooting

### Registration Issues
- Check email confirmation is disabled in Supabase
- Verify profiles table has no foreign key constraints
- See: [FINAL_FIX_REGISTRATION.md](FINAL_FIX_REGISTRATION.md)

### Storage Issues
- Verify `student-photos` bucket exists and is public
- Check storage policies allow uploads
- See: [CREATE_STORAGE_BUCKET.md](CREATE_STORAGE_BUCKET.md)

### Admin Login Issues
- Verify `VITE_ADMIN_MASTER_KEY` environment variable is set
- Use exact same key in login form

## License

MIT License - Northern Bukidnon State College

## Support

For issues or questions, contact the NBSC Guidance and Counseling Office.
