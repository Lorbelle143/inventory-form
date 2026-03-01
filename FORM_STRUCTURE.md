# Individual Inventory Form Structure

Based on Northern Bukidnon State College Guidance and Counseling Office forms.

## Form Sections

### Section 1: Basic Information & Contact

#### Personal Details
- Last Name, First Name, Middle Initial
- Program & Year (e.g., BSIT - First year)
- Birth Date
- ID Number
- Gender (Male/Female)
- Ethnicity
- Religion
- Civil Status (Single/Married/Widowed/Separated)
- Student Photo (2x2, max 5MB)

#### Contact Information
- Mobile Phone Number
- Personal Email Address
- Institutional Email Address
- Permanent Address
- Current Address (if different)

#### For Married Students Only
- Spouse Name
- Spouse Age
- Spouse Occupation
- Spouse Contact Number

#### Working Status
- Are you working? (Yes/No)
- If working: Occupation

### Section 2: Family Background

#### Mother's Profile
- Name
- Age and Birthday
- Ethnicity
- Educational Attainment
- Occupation
- Company
- Monthly Income
- Contact Number

#### Father's Profile
- Name
- Age and Birthday
- Ethnicity
- Educational Attainment
- Occupation
- Company
- Monthly Income
- Contact Number

#### Parents Status
- Status of Parents:
  - Living Together
  - Single Parent
  - Separated
  - Divorced/Annulled
  - Widowed/Widower
- Number of Siblings
- Name of Guardian/s (if applicable)
- Address of Guardian/s

### Section 3: Interests, Health & Life Circumstances

#### Interests & Recreational Activities
- Hobbies
- Talents
- Sports
- Socio-civic activities
- School Organizations

#### Health Information
- Have you ever been hospitalized? (Yes/No + Reason)
- Have you ever undergone operation? (Yes/No + Reason)
- Do you currently suffer from any illness?
- Common illness in the family
- When did you last visit the doctor?
- Reason for the visit

#### Life Circumstances
Check any problems that currently concern you:
- Grief
- Self-confidence
- Academic Performance
- Career
- Financial
- Stress
- Anger
- Relationships with: Father, Mother, Siblings, Teachers
- Loneliness

#### Counselor's Section
- Counselor's Remarks (for counselor use only)
- Assessed by (Guidance Counselor's Name and Signature)

## Additional Forms Referenced

### WHODAS 2.0 (WHO Disability Assessment Schedule)
Assesses health conditions and disability levels across:
- Understanding and communicating
- Getting around
- Self-care
- Getting along with people
- Life activities
- Participation in society

### PID-5-BF (Personality Inventory for DSM-5)
Brief personality assessment covering 25 statements about:
- Emotional patterns
- Interpersonal relationships
- Behavioral tendencies
- Self-perception

### Counseling Consent Form
- Explains guidance and counseling process
- Confidentiality agreements
- Exceptions to confidentiality
- Student consent signature

## Data Storage

All form data is stored in:
1. **Supabase Database** (Primary)
   - Structured data in PostgreSQL
   - Photos in Supabase Storage
   - Full form data in JSONB format

2. **Google Sheets** (Secondary/Backup)
   - Via Google Forms integration
   - Easy sharing and export
   - Automatic organization

## Privacy & Security

- All data encrypted at rest
- Row Level Security (RLS) enabled
- Students can only view their own data
- Admin requires master key authentication
- Counselor remarks are confidential
- Photo storage with secure access policies

## Form Validation

- Required fields marked with asterisk
- Photo size limit: 5MB
- Email format validation
- Phone number format validation
- Date format validation
- Minimum age requirement (if applicable)

## Accessibility Features

- Keyboard navigation support
- Screen reader compatible
- Clear labels and instructions
- Error messages with guidance
- Progress indicator
- Section-by-section completion
- Save and continue later (future feature)
