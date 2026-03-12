# Mental Health Assessment Feature

## Overview
Added a comprehensive mental health assessment system based on the Brief Symptom Rating Scale (BSRS-5) to help identify students who may need counseling support.

## Features Added

### 1. Student Assessment Form (`/mental-health-assessment`)
- **5 Questions** based on BSRS-5:
  1. Feeling alone (including falling asleep)
  2. Feeling blue
  3. Feeling easily annoyed or irritated
  4. Feeling tense, anxious
  5. Having suicidal thoughts

- **Rating Scale**: 0-4 (Never, Rarely, Sometimes, Often, Always)
- **Visual Interface**: Emoji-based selection for easy understanding
- **Automatic Scoring**: Calculates total score (0-20)
- **Risk Assessment**: Categorizes into low, moderate, high, or critical risk

### 2. Counseling Requirements
- **Score >= 10**: Student required to visit Guidance Counseling Office
- **Suicidal Thoughts > 0**: Immediate counseling required
- **Location**: SC Room 108 (as specified)
- **Alert Message**: Displayed after submission if counseling is required

### 3. Quick Action Integration
- Added "Mental Health Test" button to Student Dashboard
- Positioned alongside "Fill New Form" and "Total Submissions"
- Green gradient design for easy identification

### 4. Admin Dashboard View
- **New Tab**: "Mental Health" section in admin dashboard
- **Filter Options**:
  - All assessments
  - High risk (score 10-14)
  - Critical risk (score 15-20)
  
- **Assessment Cards Display**:
  - Student name and ID
  - Total score (out of 20)
  - Risk level badge (color-coded)
  - Individual question scores
  - Suicidal thoughts indicator (⚠️ if present)
  - Counseling requirement alert
  - Submission date

### 5. Database Schema
**Table**: `mental_health_assessments`
- Stores all assessment responses
- Tracks risk levels and counseling requirements
- Includes counseling status tracking (pending, scheduled, completed)
- Row-level security for student privacy

## Files Created/Modified

### New Files:
1. `src/pages/MentalHealthAssessment.tsx` - Student assessment form
2. `src/components/MentalHealthAdmin.tsx` - Admin view component
3. `src/components/MentalHealthAssessmentCard.tsx` - Quick action card
4. `supabase/mental-health-assessment.sql` - Database schema

### Modified Files:
1. `src/App.tsx` - Added route for mental health assessment
2. `src/pages/StudentDashboard.tsx` - Added quick action button
3. `src/pages/AdminDashboard.tsx` - Added mental health view tab

## Setup Instructions

### 1. Database Setup
Run the SQL migration:
```bash
psql -h your-supabase-host -U postgres -d postgres -f supabase/mental-health-assessment.sql
```

Or execute in Supabase SQL Editor:
- Navigate to Supabase Dashboard > SQL Editor
- Copy contents of `supabase/mental-health-assessment.sql`
- Execute the script

### 2. Test the Feature

**As Student:**
1. Login to student account
2. Click "Mental Health Test" in Quick Actions
3. Complete the 5-question assessment
4. Submit and check for counseling requirement message

**As Admin:**
1. Login to admin account
2. Click "Mental Health" tab in dashboard
3. View all student assessments
4. Filter by risk level
5. Identify students requiring counseling

## Risk Level Criteria

- **Low** (0-5): Green badge - No immediate concern
- **Moderate** (6-9): Yellow badge - Monitor situation
- **High** (10-14): Orange badge - Counseling required
- **Critical** (15-20): Red badge - Urgent counseling required

## Counseling Alert Triggers

1. **Total Score >= 10**: Automatic counseling requirement
2. **Suicidal Thoughts > 0**: Immediate counseling requirement regardless of total score

## Privacy & Security

- Row-level security enabled
- Students can only view their own assessments
- Admins can view all assessments
- Secure data storage in Supabase

## Future Enhancements (Optional)

- Email notifications to counselors for high-risk cases
- Counseling appointment scheduling system
- Follow-up assessment reminders
- Trend analysis and reporting
- Export assessment data to CSV
- Counseling session notes and tracking

## Support

For questions or issues, contact the Guidance and Counseling Office at SC Room 108.
