# Document Scanner Feature

## Overview
Students can now scan or photograph 4 required documents directly from their mobile devices when filling out the inventory form.

## Required Documents
1. WHODAS 2.0 Form
2. Individual Inventory Form
3. PID-5-BF Form
4. Counseling Consent Form

## How It Works

### For Students (Mobile/Desktop)
1. Navigate to the Inventory Form (Section 1)
2. Upload your 2x2 photo as usual
3. In the "Required Documents" section, you'll see:
   - **Scan/Camera** button - Opens camera to take photos directly
   - **Upload Files** button - Select images from gallery/files
4. Take or upload 4 document photos (one for each required form)
5. Preview all documents before submitting
6. Remove any document by hovering and clicking the X button
7. Submit the form - all documents are uploaded to Supabase Storage

### For Admin
1. View student records in the Admin Dashboard
2. Click "View" on any student card
3. Scroll down to see "Uploaded Documents" section
4. View all 4 documents in a grid layout
5. Click any document to view full size in new tab

## Technical Details

### Storage
- Documents are stored in Supabase Storage bucket: `student-photos`
- File naming: `{user_id}_doc{1-4}_{timestamp}.{ext}`
- Maximum file size: 5MB per document
- Supported formats: JPG, PNG, PDF

### Database
- Document URLs are stored in `inventory_submissions.form_data.documentUrls` as an array
- Example: `["url1", "url2", "url3", "url4"]`

### Validation
- Form requires exactly 4 documents before submission
- Each document must be under 5MB
- Error message shown if requirements not met

## Mobile Camera Access
The scanner uses HTML5 `capture="environment"` attribute to:
- Open rear camera on mobile devices
- Allow direct photo capture
- Support multiple photos in sequence

## Component Structure
```
src/components/DocumentScanner.tsx
- Handles file selection (camera + gallery)
- Shows preview grid with 4 slots
- Manages document state
- Validates file sizes

src/pages/InventoryForm.tsx
- Integrates DocumentScanner component
- Uploads documents to Supabase Storage
- Saves document URLs to database

src/pages/AdminDashboard.tsx
- Displays uploaded documents in view modal
- Provides links to view full-size images
```

## Testing Checklist
- [ ] Camera opens on mobile devices
- [ ] Can upload from gallery
- [ ] Preview shows all 4 documents
- [ ] Can remove documents
- [ ] Form validates 4 documents required
- [ ] Documents upload to Supabase Storage
- [ ] URLs saved to database correctly
- [ ] Admin can view all documents
- [ ] Full-size view works in new tab
