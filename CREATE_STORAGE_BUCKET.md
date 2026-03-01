# Create Storage Bucket for Student Photos

## Step-by-Step Guide

### Method 1: Via Supabase Dashboard (EASIEST)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Click "Storage"** in the left sidebar
4. **Click "Create a new bucket"** button (green button)
5. **Fill in the form**:
   - **Name**: `student-photos` (exactly this name!)
   - **Public bucket**: Toggle ON (make it public)
   - **File size limit**: 5MB (optional)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/jpg`
6. **Click "Create bucket"**

✅ Done! Your bucket is ready.

---

### Method 2: Via SQL (Alternative)

If you can't access the dashboard, run this in **SQL Editor**:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies to allow uploads
CREATE POLICY "Allow public uploads to student-photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "Allow public access to student-photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'student-photos');

CREATE POLICY "Allow public updates to student-photos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'student-photos')
  WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "Allow public deletes from student-photos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'student-photos');
```

---

## Verify Bucket Exists

### Via Dashboard:
1. Go to **Storage**
2. You should see **"student-photos"** bucket listed

### Via SQL:
```sql
SELECT * FROM storage.buckets WHERE name = 'student-photos';
```

Should return 1 row with:
- id: `student-photos`
- name: `student-photos`
- public: `true`

---

## Test Photo Upload

After creating the bucket, test it:

1. **Register a new student**
2. **Login as student**
3. **Go to "Fill Inventory Form"**
4. **Upload a photo** (JPG, PNG, max 5MB)
5. **Submit the form**

Should see: ✅ "Form submitted successfully"

---

## Troubleshooting

### Error: "Bucket not found"
- Make sure bucket name is exactly `student-photos` (lowercase, with hyphen)
- Check if bucket exists in Storage dashboard

### Error: "Policy violation"
- Run the SQL policies above
- Or disable RLS on storage.objects:
  ```sql
  ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
  ```

### Error: "File too large"
- Max file size is 5MB
- Compress the image before uploading

### Can't see uploaded photos
- Make sure bucket is **public** (toggle ON)
- Check the photo URL in browser

---

## Storage Bucket Settings

**Recommended settings**:
- ✅ Public bucket: ON
- ✅ File size limit: 5MB
- ✅ Allowed MIME types: image/jpeg, image/png, image/jpg
- ✅ RLS policies: Allow all operations

---

## Quick Check

Run this to see all your buckets:
```sql
SELECT id, name, public FROM storage.buckets;
```

You should see:
```
id              | name           | public
----------------|----------------|--------
student-photos  | student-photos | true
```

✅ Perfect! Now you can upload photos.
