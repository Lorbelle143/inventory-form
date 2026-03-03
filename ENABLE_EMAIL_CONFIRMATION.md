# Enable Email Confirmation - Setup Guide

This guide will help you enable email confirmation for enhanced security in the Student Inventory Management System.

## Why Enable Email Confirmation?

✅ **Security Benefits:**
- Verifies that students own the NBSC email they register with
- Prevents fake registrations with invalid emails
- Ensures only legitimate NBSC students can access the system
- Adds an extra layer of authentication

## Prerequisites

Before enabling email confirmation, ensure you have:
1. Access to Supabase Dashboard
2. SMTP email provider configured (or use Supabase's default)
3. Database access to run SQL scripts

## Step-by-Step Setup

### Step 1: Configure Email Settings in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Auth** section
4. Configure the following:

   **Enable Email Confirmations:**
   - ✅ Check "Enable email confirmations"
   
   **Confirmation Email Settings:**
   - Confirmation URL: `https://your-domain.com/auth/confirm` (or use default)
   - Email confirmation expiry: `24 hours` (recommended)
   
   **Email Templates:**
   - Customize the confirmation email template (optional)
   - Add your school logo and branding

### Step 2: Configure SMTP (Optional but Recommended)

For production, use a custom SMTP provider for better deliverability:

**Recommended Providers:**
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **AWS SES** (Very cheap, high volume)
- **Resend** (Modern, developer-friendly)

**SMTP Configuration in Supabase:**
1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable custom SMTP
3. Enter your SMTP credentials:
   ```
   Host: smtp.sendgrid.net (or your provider)
   Port: 587
   Username: apikey (for SendGrid)
   Password: your-api-key
   Sender email: noreply@nbsc.edu.ph
   Sender name: NBSC Student System
   ```

### Step 3: Run SQL Script to Enable Email Confirmation

1. Open Supabase SQL Editor
2. Run the script from `supabase/enable-email-confirmation.sql`:

```sql
-- This will:
-- 1. Remove auto-confirm trigger
-- 2. Enable email confirmation requirement
-- 3. Add email confirmation handler
```

3. Verify the changes:
```sql
-- Check if trigger was removed
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_confirm';

-- Should return no rows
```

### Step 4: Test Email Confirmation Flow

1. **Register a new test account:**
   - Use a real NBSC email you have access to
   - Complete the registration form
   - You should see: "Please check your email to confirm your account"

2. **Check your email:**
   - Look for confirmation email from Supabase
   - Check spam folder if not in inbox
   - Email should arrive within 1-2 minutes

3. **Click confirmation link:**
   - Opens confirmation page
   - Account is now verified

4. **Try to login:**
   - Before confirmation: Should show "Please verify your email first"
   - After confirmation: Login should work normally

### Step 5: Update Existing Users (Optional)

If you have existing users who registered before email confirmation was enabled:

**Option A: Require all users to confirm (Strict)**
```sql
-- Force all users to confirm their email
UPDATE auth.users 
SET email_confirmed_at = NULL 
WHERE email_confirmed_at IS NOT NULL;
```

**Option B: Auto-confirm existing users (Lenient)**
```sql
-- Keep existing users confirmed, only new users need confirmation
-- No action needed - existing users remain confirmed
```

## Email Template Customization

### Customize Confirmation Email

1. Go to **Authentication** → **Email Templates** → **Confirm signup**
2. Edit the template:

```html
<h2>Welcome to NBSC Student Inventory System!</h2>
<p>Hi there,</p>
<p>Thank you for registering with your NBSC email.</p>
<p>Please confirm your email address by clicking the button below:</p>
<a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
  Confirm Email Address
</a>
<p>This link will expire in 24 hours.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
<p>Best regards,<br>NBSC Guidance and Counseling Office</p>
```

## Troubleshooting

### Issue: Emails not being received

**Solutions:**
1. Check spam/junk folder
2. Verify SMTP settings are correct
3. Check Supabase logs for email errors
4. Test with different email provider
5. Ensure sender email is not blacklisted

### Issue: Confirmation link expired

**Solutions:**
1. Resend confirmation email:
```javascript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: 'student@nbsc.edu.ph'
});
```

2. Increase expiry time in Supabase settings

### Issue: Users can't login after confirmation

**Solutions:**
1. Check if email_confirmed_at is set:
```sql
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'student@nbsc.edu.ph';
```

2. Manually confirm user (emergency only):
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'student@nbsc.edu.ph';
```

## Rate Limits

### Supabase Free Tier Email Limits:
- **4 emails per hour** per project
- Resets every hour
- Includes: signup confirmations, password resets, magic links

### Solutions for Rate Limits:
1. **Use custom SMTP** (recommended for production)
2. **Upgrade to Pro plan** ($25/month, higher limits)
3. **Batch registrations** during off-peak hours
4. **Implement email queue** for high-volume periods

## Security Best Practices

1. **Email Expiry:** Keep confirmation links valid for 24 hours max
2. **Rate Limiting:** Limit registration attempts per IP
3. **Domain Validation:** Already implemented (@nbsc.edu.ph only)
4. **HTTPS Only:** Ensure all confirmation links use HTTPS
5. **Monitor Logs:** Track failed confirmation attempts

## Monitoring & Analytics

### Track Email Confirmation Metrics:

```sql
-- Confirmation rate
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  ROUND(COUNT(email_confirmed_at)::numeric / COUNT(*) * 100, 2) as confirmation_rate
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days';

-- Average time to confirm
SELECT 
  AVG(email_confirmed_at - created_at) as avg_confirmation_time
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days';

-- Unconfirmed users (older than 24 hours)
SELECT email, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
  AND created_at < NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## Rollback (Disable Email Confirmation)

If you need to disable email confirmation:

1. Run the original script:
```sql
-- From supabase/disable-email-confirmation.sql
-- This will auto-confirm all new users
```

2. In Supabase Dashboard:
   - Go to **Authentication** → **Settings**
   - Uncheck "Enable email confirmations"

## Support & Resources

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Email Templates:** https://supabase.com/docs/guides/auth/auth-email-templates
- **SMTP Setup:** https://supabase.com/docs/guides/auth/auth-smtp

## Summary Checklist

- [ ] Enable email confirmations in Supabase Dashboard
- [ ] Configure SMTP provider (optional but recommended)
- [ ] Run enable-email-confirmation.sql script
- [ ] Customize email template with NBSC branding
- [ ] Test registration and confirmation flow
- [ ] Update existing users (if needed)
- [ ] Monitor confirmation rates
- [ ] Set up email alerts for failures

---

**Note:** Email confirmation is now enabled in the application code. Students will see appropriate messages during registration and login if their email is not confirmed.
