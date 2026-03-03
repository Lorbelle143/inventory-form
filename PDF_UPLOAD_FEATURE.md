# PDF Upload Feature

Students can now upload PDF documents in addition to images for their inventory form submissions.

## Features

### 1. Multiple File Type Support
- **Images**: JPG, PNG (5MB max each)
- **PDFs**: PDF documents (10MB max each)
- **Mixed uploads**: Students can upload both images and PDFs together

### 2. Document Scanner Component
- **Scan/Camera button**: Take photos directly using device camera
- **Upload Files button**: Select images or PDFs from device storage
- **Maximum 4 documents**: Students can upload up to 4 files total
- **Visual preview**: 
  - Images show thumbnail preview
  - PDFs show red PDF icon with filename

### 3. File Validation
- **Size limits**:
  - Images: 5MB maximum
  - PDFs: 10MB maximum
- **File type validation**: Only accepts images (JPG, PNG) and PDFs
- **Automatic detection**: System automatically detects file type

### 4. Display & Viewing
- **Admin Dashboard**: 
  - PDFs show with red PDF icon
  - Click to open PDF in new tab
  - Images show thumbnail preview
- **Student Dashboard**:
  - Same PDF/image display
  - Click any document to view full size

## How to Use

### For Students:

1. **Fill out the inventory form**
2. **In Section 3 - Document Upload**:
   - Click "Scan/Camera" to take photos
   - OR click "Upload Files" to select PDFs/images
3. **Upload required documents**:
   - WHODAS 2.0 Form (can be PDF or image)
   - Individual Inventory Form (can be PDF or image)
   - PID-5-BF Form (can be PDF or image)
   - Counseling Consent Form (can be PDF or image)
4. **Submit the form**

### For Admins:

1. **View submissions** in Admin Dashboard
2. **Click on any submission** to view details
3. **Scroll to "Uploaded Documents" section**
4. **Click on PDF icon** to open PDF in new tab
5. **Click on image** to view full size

## Technical Details

### File Storage
- All files stored in Supabase Storage bucket: `student-photos`
- PDFs and images stored in same bucket
- Public URLs generated for each file

### File Upload Process
1. Student selects file (image or PDF)
2. File validated for size and type
3. File uploaded to Supabase Storage
4. Public URL generated
5. URL saved in `form_data.documentUrls` array

### Database Structure
```json
{
  "form_data": {
    "documentUrls": [
      "https://...storage.../document1.pdf",
      "https://...storage.../document2.jpg",
      "https://...storage.../document3.png",
      "https://...storage.../document4.pdf"
    ]
  }
}
```

## File Size Limits

### Why Different Limits?
- **Images (5MB)**: Photos from phones are typically 2-4MB
- **PDFs (10MB)**: Scanned documents can be larger, especially multi-page PDFs

### Recommendations for Students:
- **For photos**: Use phone camera, no compression needed
- **For PDFs**: 
  - Use PDF scanner apps (CamScanner, Adobe Scan)
  - Compress large PDFs if over 10MB
  - Split multi-page PDFs if needed

## Supported File Types

### Images
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ WEBP (.webp)
- ❌ GIF (not supported)
- ❌ BMP (not supported)

### Documents
- ✅ PDF (.pdf)
- ❌ Word (.doc, .docx) - convert to PDF first
- ❌ Excel (.xls, .xlsx) - convert to PDF first

## Visual Indicators

### In Upload Interface:
- **Empty slot**: Gray dashed border with "+" icon
- **Image uploaded**: Thumbnail preview with "📷 Image" label
- **PDF uploaded**: Red PDF icon with "📄 PDF" label
- **Remove button**: Red X button on hover

### In View Mode:
- **Image**: Full thumbnail with "View Full Size" link
- **PDF**: Red PDF icon with "Open PDF" link
- **Click anywhere**: Opens document in new tab

## Troubleshooting

### Issue: "File too large" error
**Solution**: 
- Images: Compress to under 5MB
- PDFs: Compress to under 10MB using online tools

### Issue: PDF not uploading
**Solution**:
- Check file is actually a PDF (not renamed image)
- Ensure file is under 10MB
- Try different browser if issue persists

### Issue: Can't see PDF preview
**Solution**:
- PDFs show red icon (not preview) - this is normal
- Click icon to open PDF in new tab
- Ensure browser allows pop-ups

### Issue: Upload button disabled
**Solution**:
- Maximum 4 documents allowed
- Remove existing documents to add new ones

## Security Considerations

### File Validation
- Server-side validation for file types
- Size limits enforced
- Malicious file detection

### Storage Security
- Files stored in secure Supabase bucket
- Public URLs but hard to guess
- Access controlled by RLS policies (when enabled)

### Privacy
- Only student and admin can view documents
- Documents linked to student profile
- Secure HTTPS URLs

## Future Enhancements

Potential improvements:
- [ ] PDF preview/thumbnail generation
- [ ] Document compression before upload
- [ ] Drag-and-drop file upload
- [ ] Bulk document download for admins
- [ ] Document annotation tools
- [ ] OCR text extraction from PDFs
- [ ] Document verification status

## Support

### For Students:
- Ensure stable internet connection when uploading
- Use WiFi for large PDF uploads
- Keep original documents as backup

### For Admins:
- Monitor storage usage in Supabase Dashboard
- Regularly backup document URLs
- Check document quality during review

## Storage Management

### Current Limits (Supabase Free Tier):
- **Total storage**: 1GB
- **Estimated capacity**: 
  - ~500 students with 4 documents each (2MB average)
  - ~200 students with 4 PDFs each (5MB average)

### Upgrade Options:
- **Pro Plan** ($25/month): 100GB storage
- **Team Plan** ($599/month): 200GB storage

### Storage Monitoring:
```sql
-- Check total storage used
SELECT pg_size_pretty(sum(size)) as total_size
FROM storage.objects
WHERE bucket_id = 'student-photos';

-- Count files by type
SELECT 
  CASE 
    WHEN name LIKE '%.pdf' THEN 'PDF'
    ELSE 'Image'
  END as file_type,
  COUNT(*) as count,
  pg_size_pretty(SUM(size)) as total_size
FROM storage.objects
WHERE bucket_id = 'student-photos'
GROUP BY file_type;
```

## Implementation Files

- `src/components/DocumentScanner.tsx` - Upload component
- `src/pages/InventoryForm.tsx` - Form integration
- `src/pages/AdminDashboard.tsx` - Admin view
- `src/pages/StudentDashboard.tsx` - Student view

---

**Note**: PDF upload feature is now live! Students can upload both images and PDFs for their required documents.
