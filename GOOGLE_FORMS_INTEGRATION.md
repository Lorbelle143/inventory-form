# Google Forms Integration Guide

## Overview

This system integrates with Google Forms to provide dual data storage:
1. Supabase database (primary, with photos)
2. Google Sheets (via Forms, for easy sharing)

## Integration Flow

```
Student fills form → Upload photo to Supabase → Save to Supabase DB → Submit to Google Forms → Data appears in Google Sheets
```

## Implementation

### Option 1: Direct API Integration (Recommended)

Update `src/pages/InventoryForm.tsx` to include Google Forms API submission:

```typescript
const submitToGoogleForms = async (data: any, photoUrl: string) => {
  const formId = import.meta.env.VITE_GOOGLE_FORM_ID;
  const apiKey = import.meta.env.VITE_GOOGLE_FORMS_API_KEY;

  // Map form fields to Google Form entry IDs
  const formData = new FormData();
  formData.append('entry.XXXXXXX', data.studentId); // Replace with actual entry IDs
  formData.append('entry.YYYYYYY', data.fullName);
  formData.append('entry.ZZZZZZZ', data.course);
  formData.append('entry.AAAAAAA', data.yearLevel);
  formData.append('entry.BBBBBBB', data.contactNumber);
  formData.append('entry.CCCCCCC', photoUrl);

  await fetch(`https://docs.google.com/forms/d/e/${formId}/formResponse`, {
    method: 'POST',
    body: formData,
    mode: 'no-cors'
  });
};
```

### Finding Entry IDs

1. Open your Google Form
2. Click "Preview" (eye icon)
3. Right-click and "Inspect Element"
4. Find input fields with names like `entry.123456789`
5. Use these IDs in your code

### Option 2: Webhook Integration

Set up a serverless function to sync data:

```typescript
// api/sync-to-sheets.ts
export default async function handler(req, res) {
  const { sheets } = google.sheets('v4');
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Sheet1!A:H',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[
        req.body.studentId,
        req.body.fullName,
        req.body.course,
        req.body.yearLevel,
        req.body.contactNumber,
        req.body.photoUrl,
        new Date().toISOString()
      ]]
    }
  });
  
  res.status(200).json({ success: true });
}
```

## Google Sheets Setup

### Automatic (via Forms)

1. Open your Google Form
2. Click "Responses" tab
3. Click green Sheets icon
4. Select "Create a new spreadsheet"
5. Responses auto-populate

### Manual (via API)

1. Create a Google Sheet
2. Share with service account email
3. Use Google Sheets API to append rows
4. Set up authentication with service account

## Data Synchronization

### Real-time Sync

Use Supabase Database Webhooks:

1. Go to Supabase Dashboard > Database > Webhooks
2. Create webhook for `inventory_submissions` table
3. Point to your sync endpoint
4. On INSERT, trigger Google Sheets update

### Batch Sync

Run periodic sync job:

```typescript
// Sync all new submissions every hour
setInterval(async () => {
  const { data } = await supabase
    .from('inventory_submissions')
    .select('*')
    .is('synced_to_sheets', false);
    
  for (const submission of data) {
    await syncToGoogleSheets(submission);
    await supabase
      .from('inventory_submissions')
      .update({ synced_to_sheets: true })
      .eq('id', submission.id);
  }
}, 3600000);
```

## Photo Handling

Photos are stored in Supabase Storage, and the public URL is sent to Google Forms/Sheets:

1. Upload to Supabase Storage
2. Get public URL
3. Include URL in Google Forms submission
4. Sheet displays clickable link to photo

## Benefits

- Dual backup of data
- Easy sharing via Google Sheets
- Familiar interface for non-technical users
- Automatic charts and analysis in Sheets
- Export capabilities (CSV, Excel, PDF)

## Limitations

- Google Forms has rate limits
- Photos not embedded in Sheets (only links)
- No real-time validation from Forms
- Requires internet connection

## Best Practices

1. Always save to Supabase first (primary source)
2. Treat Google Sheets as secondary/backup
3. Handle Google API failures gracefully
4. Log sync errors for debugging
5. Implement retry logic for failed syncs
