# Quick Fix: Email Rate Limit Exceeded

## Problem
Supabase sends confirmation emails on every registration, causing rate limit errors (4 emails/hour limit).

## INSTANT FIX (Do this NOW)

### Step 1: Disable Email Confirmation in Supabase Dashboard

1. Open your Supabase project: https://supabase.com/dashboard
2. Click **"Authentication"** (left sidebar)
3. Click **"Providers"** tab
4. Find **"Email"** and click on it
5. **TURN OFF** the toggle for **"Confirm email"**
6. Click **"Save"**

✅ Done! Now you can register unlimited users without email confirmation.

---

## Alternative: Auto-Confirm via SQL (If you can't access dashboard)

Run this in **Supabase SQL Editor**:

```sql
-- Auto-confirm all new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Verify It's Working

After disabling email confirmation:

1. Try registering a new student
2. You should see: ✅ "Registration successful!"
3. No email will be sent
4. You can login immediately

---

## For Production (Later)

When deploying to production:

1. **Enable email confirmation** again
2. **Set up custom SMTP** (SendGrid, Mailgun, AWS SES)
3. **Increase rate limits** with paid plan

---

## Still Getting Error?

If you still see "email rate limit exceeded":

### Option 1: Wait 1 Hour
The rate limit resets after 1 hour.

### Option 2: Use Different Email
Register with a different email address.

### Option 3: Clear Rate Limit (SQL)
```sql
-- This won't work on free tier, but try it:
DELETE FROM auth.rate_limits WHERE email = 'your-email@example.com';
```

---

## Summary

**EASIEST FIX**: Go to Supabase Dashboard → Authentication → Providers → Email → Turn OFF "Confirm email" → Save

That's it! 🎉
