# Email Setup Guide for Supabase

## Problem: Emails not arriving (Registration, Password Reset)

### Quick Checks:
1. ✅ Check your SPAM/JUNK folder
2. ✅ Wait 5-10 minutes (sometimes delayed)
3. ✅ Check if email is correct

---

## Solution 1: Configure Supabase Email Settings

### Step 1: Go to Supabase Dashboard
1. Login to https://supabase.com
2. Select your project: `unobjdaozvkdbdfbmwfq`

### Step 2: Configure Email Templates
1. Go to **Authentication** → **Email Templates**
2. Check these templates:
   - ✅ Confirm signup
   - ✅ Reset password
   - ✅ Magic Link

### Step 3: Check Email Rate Limits
1. Go to **Authentication** → **Settings**
2. Scroll to **Rate Limits**
3. Free tier limits:
   - 3 emails per hour per user
   - 30 emails per hour total

**If you hit the rate limit:**
- Wait 1 hour
- Or upgrade to Pro plan ($25/month)

---

## Solution 2: Use Custom SMTP (Recommended for Production)

### Step 1: Get SMTP Credentials
Use one of these providers:
- **Gmail** (Free, 500 emails/day)
- **SendGrid** (Free, 100 emails/day)
- **Mailgun** (Free, 5000 emails/month)
- **AWS SES** (Very cheap)

### Step 2: Configure in Supabase
1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter your SMTP details:
   ```
   Host: smtp.gmail.com (for Gmail)
   Port: 587
   Username: your-email@gmail.com
   Password: your-app-password
   Sender email: your-email@gmail.com
   Sender name: NBSC Guidance System
   ```

### For Gmail SMTP:
1. Go to https://myaccount.google.com/apppasswords
2. Create an "App Password"
3. Use that password (not your regular password)

---

## Solution 3: Disable Email Confirmation (Development Only)

If you just want to test without emails:

1. Go to **Authentication** → **Settings**
2. Find **Email Auth**
3. Toggle OFF: "Enable email confirmations"

OR run this SQL in SQL Editor:
```sql
-- Disable email confirmation
UPDATE auth.users
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

---

## Solution 4: Check Email Deliverability

### In Supabase Dashboard:
1. Go to **Authentication** → **Users**
2. Find your test user
3. Check the "Email Confirmed" column
4. If not confirmed, click the user → "Send confirmation email"

### Check Logs:
1. Go to **Logs** → **Auth Logs**
2. Look for email sending errors
3. Common errors:
   - "Rate limit exceeded"
   - "SMTP connection failed"
   - "Invalid email address"

---

## Current Configuration Check

Your current setup:
- Supabase URL: `https://unobjdaozvkdbdfbmwfq.supabase.co`
- Using default Supabase email service
- Email domain: `@nbsc.edu.ph`

**Recommended Actions:**
1. ✅ Check Supabase Auth Logs for errors
2. ✅ Verify email rate limits not exceeded
3. ✅ Configure custom SMTP for reliable delivery
4. ✅ For testing: Disable email confirmation temporarily

---

## Testing Email Delivery

After configuration, test with:

1. **Register a new user**
   - Use a real email you can access
   - Check inbox and spam folder
   - Wait 5 minutes

2. **Password Reset**
   - Go to Forgot Password page
   - Enter email
   - Check for reset email

3. **Check Supabase Logs**
   - Authentication → Logs
   - Look for "email sent" or errors

---

## Production Recommendations

For production deployment:
1. ✅ Use custom SMTP (Gmail, SendGrid, etc.)
2. ✅ Configure proper email templates
3. ✅ Set up email domain verification
4. ✅ Monitor email delivery rates
5. ✅ Have backup email provider

---

## Need Help?

If emails still not working:
1. Check Supabase Auth Logs
2. Verify SMTP settings
3. Test with different email provider
4. Contact Supabase support

**Quick Fix for Development:**
Run the SQL in `supabase/disable-email-confirmation.sql` to bypass email verification during testing.
