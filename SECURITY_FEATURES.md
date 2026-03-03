# Security Features

This document outlines the authentication and security features implemented in the Student Inventory Management System.

## Authentication Features

### 1. Email Domain Validation
- **Restriction**: Only NBSC student emails (@nbsc.edu.ph) can register
- **Example**: `20201362@nbsc.edu.ph` ✅ | `personal@gmail.com` ❌
- **Real-time Validation**: Users get instant feedback while typing
- **Implementation**: `src/pages/Register.tsx`

### 2. Email Confirmation (Verification)
- **Required**: Students must verify their email before login
- **Security**: Ensures students own the NBSC email they register with
- **Expiry**: Confirmation links expire after 24 hours
- **Resend**: Students can request a new confirmation email if needed
- **Implementation**: `src/pages/Login.tsx`, `src/pages/Register.tsx`
- **Setup Guide**: See `ENABLE_EMAIL_CONFIRMATION.md`

### 3. Session Management
- **Persistent Sessions**: User sessions are maintained across page refreshes
- **Token Refresh**: Automatic token refresh to keep sessions alive
- **Session Storage**: Secure session storage using Supabase Auth
- **Implementation**: `src/store/authStore.ts`

### 3. Route Protection
- **Protected Routes**: Dashboard and forms require authentication
- **Auto-redirect**: Unauthenticated users are redirected to login
- **Role-based Access**: Students and admins have separate dashboards
- **Loading State**: Shows loading screen while verifying authentication
- **Implementation**: `src/App.tsx`

### 4. Session Timeout (Auto-logout)
- **Inactivity Timeout**: 30 minutes of inactivity triggers auto-logout
- **Activity Detection**: Monitors mouse, keyboard, scroll, touch, and click events
- **Warning Alert**: Users are notified when session expires
- **Auto-reset**: Timeout resets on any user activity
- **Implementation**: `src/hooks/useSessionTimeout.ts`

### 5. Authentication Verification
- **Component-level Checks**: Each protected page verifies authentication on mount
- **Continuous Monitoring**: Auth state changes are tracked in real-time
- **Automatic Logout**: Invalid sessions trigger automatic logout
- **Implementation**: `src/pages/StudentDashboard.tsx`, `src/pages/InventoryForm.tsx`

## Security Best Practices

### Password Requirements
- Minimum 6 characters
- Validated on both client and server side
- Stored securely using Supabase Auth (bcrypt hashing)

### Data Protection
- **RLS Disabled**: For development ease (should be enabled in production)
- **Secure Storage**: Photos and documents stored in Supabase Storage
- **Access Control**: Students can only view/edit their own submissions
- **Admin Separation**: Admin access requires master key

### Session Security
- **Secure Cookies**: Session tokens stored in secure HTTP-only cookies
- **Token Expiration**: Tokens expire after inactivity
- **CSRF Protection**: Built-in CSRF protection via Supabase
- **XSS Prevention**: React's built-in XSS protection

## Configuration

### Adjust Session Timeout
Edit `src/hooks/useSessionTimeout.ts`:
```typescript
const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
```

### Change Email Domain
Edit `src/pages/Register.tsx`:
```typescript
if (!formData.email.endsWith('@nbsc.edu.ph')) {
  // Change domain here
}
```

### Enable Row Level Security (Production)
Run in Supabase SQL Editor:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_submissions ENABLE ROW LEVEL SECURITY;

-- Add policies for students to access only their data
CREATE POLICY "Students can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Students can view own submissions"
  ON inventory_submissions FOR SELECT
  USING (auth.uid() = user_id);
```

## Authentication Flow

### Student Registration
1. User enters NBSC email (@nbsc.edu.ph)
2. Email domain is validated
3. Password requirements checked
4. Supabase Auth creates user account
5. **Confirmation email sent to student**
6. **Student clicks confirmation link in email**
7. **Email is verified, account activated**
8. Profile record created in database
9. User redirected to login

### Student Login
1. User enters Student ID + Password
2. System looks up email by Student ID
3. **System checks if email is confirmed**
4. If not confirmed: Shows "Please verify your email" error
5. If confirmed: Supabase Auth validates credentials
6. Session token generated and stored
7. User redirected to dashboard
8. Session timeout timer starts

### Session Expiration
1. User inactive for 30 minutes
2. Timeout triggers auto-logout
3. Alert shown to user
4. Session cleared from storage
5. User redirected to login page

## Security Recommendations for Production

1. **Enable Email Confirmation**: Follow `ENABLE_EMAIL_CONFIRMATION.md` guide
2. **Enable RLS**: Turn on Row Level Security for all tables
3. **HTTPS Only**: Ensure all traffic uses HTTPS
4. **Strong Passwords**: Increase minimum password length to 8+ characters
5. **Custom SMTP**: Use SendGrid, Mailgun, or AWS SES for email delivery
6. **Rate Limiting**: Add rate limiting to prevent brute force attacks
7. **Audit Logging**: Log all authentication attempts
8. **2FA**: Consider adding two-factor authentication
9. **Password Reset**: Implement secure password reset flow
10. **Session Monitoring**: Track active sessions per user
11. **Regular Updates**: Keep all dependencies up to date

## Monitoring & Alerts

### Track Authentication Events
Monitor these events in Supabase Dashboard:
- Failed login attempts
- New registrations
- Session expirations
- Password changes
- Suspicious activity patterns

### Security Metrics
- Average session duration
- Login success/failure rate
- Registration completion rate
- Session timeout frequency
- Invalid email attempts

## Support

For security concerns or questions:
- Review Supabase Auth documentation
- Check application logs
- Contact system administrator
- Report security issues immediately
