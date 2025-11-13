# 📧 Supabase Email Capture Setup Guide

## Complete Step-by-Step Instructions

---

## Part 1: Create Supabase Project (5 minutes)

### Step 1: Sign Up
1. Go to: **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with **GitHub** (recommended)
4. Verify your email if needed

### Step 2: Create New Project
1. Click **"New Project"**
2. Fill in project details:
   - **Name**: `resume-optimizer`
   - **Database Password**: Create a strong password (**SAVE THIS!**)
   - **Region**: Choose closest to you (e.g., `East US (North Virginia)`)
   - **Pricing Plan**: Free (no credit card required)
3. Click **"Create new project"**
4. Wait 2-3 minutes while Supabase provisions your database
   - You'll see a progress indicator
   - Get coffee ☕

---

## Part 2: Create Waitlist Table (3 minutes)

### Step 3: Create Table

Once your project is ready (you'll see the dashboard):

1. Click **"Table Editor"** in the left sidebar
2. Click **"Create a new table"** button (top right)
3. Configure table:
   - **Name**: `waitlist`
   - **Description**: "Email signups for waitlist" (optional)
   - **Enable Row Level Security (RLS)**: ✓ **CHECK THIS BOX**

4. **Columns** - Add these columns:

Click **"+ Add column"** for each:

**Column 1:**
- Name: `id`
- Type: `uuid`
- Default value: `gen_random_uuid()`
- ✓ Is Primary Key
- ✓ Is Identity (auto-generated)

**Column 2:**
- Name: `created_at`
- Type: `timestamptz`
- Default value: `now()`
- ✓ Is Identity (auto-generated)

**Column 3:**
- Name: `email`
- Type: `text`
- Default value: (leave empty)
- ✓ Is Nullable: **UNCHECK** (required field)

**Column 4:**
- Name: `referral_source`
- Type: `text`
- Default value: (leave empty)
- ✓ Is Nullable: **CHECK** (optional)

**Column 5:**
- Name: `ip_address`
- Type: `text`
- Default value: (leave empty)
- ✓ Is Nullable: **CHECK** (optional)

5. Click **"Save"** (bottom right)

---

## Part 3: Set Up Security (2 minutes)

### Step 4: Create RLS Policy

**This allows anyone to submit emails but not read them:**

1. In **Table Editor**, click on the `waitlist` table
2. Click the **"RLS disabled"** button (top right) or go to **Authentication → Policies**
3. You should see "Row Level Security" section
4. Click **"New Policy"**
5. Choose **"Create a policy from scratch"** (or "For full customization")

**Configure the policy:**
- **Policy name**: `Allow public email inserts`
- **Allowed operation**: Check **INSERT only** (uncheck SELECT, UPDATE, DELETE)
- **Target roles**: `public` (default)
- **USING expression**: `true`
- **WITH CHECK expression**: `true`

6. Click **"Review"** then **"Save policy"**

**Optional: Add unique constraint on email**
1. Click **"≡"** menu on `waitlist` table → **"Edit Table"**
2. Click on `email` column
3. Check **"Is Unique"** ✓
4. Save

This prevents duplicate email entries.

---

## Part 4: Get Your API Keys

### Step 5: Copy Credentials

1. Click **"Settings"** (gear icon) in left sidebar
2. Click **"API"** under Project Settings
3. **Copy these two values** (you'll need them soon):

**URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
(Example: `https://abcdefghijklmnop.supabase.co`)

**anon / public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```
(Long string starting with `eyJ...`)

**⚠️ SAVE THESE SOMEWHERE SAFE!** (You'll need them in the next step)

---

## Part 5: Update Landing Page (3 minutes)

### Step 6: Add Credentials to Code

**Option A: Direct Edit (Quick for testing)**

1. Open `landing.html` in your code editor
2. Find these lines near the bottom (around line 850):
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace with your actual values:
```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

4. Save the file

**⚠️ Security Note:**
- The `anon` key is **safe to expose** in client-side code
- It only allows INSERT operations (thanks to RLS policies)
- Never commit your `service_role` key to public repos!

**Option B: Environment Variables (Production-ready)**

For better security, use Vercel Environment Variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`: `https://xxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbG...`
3. Update code to use `import.meta.env.VITE_SUPABASE_URL`

(For now, Option A is fine for getting started)

---

## Part 6: Test Locally (Optional)

### Step 7: Test Before Deploying

```bash
# Start local server
python3 -m http.server 8080

# Or use Node.js
npx serve
```

1. Open http://localhost:8080/landing.html
2. Submit a test email
3. Check Supabase Table Editor → `waitlist` table
4. You should see your test email! ✅

---

## Part 7: Deploy to Vercel

### Step 8: Push and Deploy

**If using resume-optimizer repo:**

```bash
# Copy updated landing.html to resume-optimizer repo
cp landing.html /path/to/resume-optimizer/

cd /path/to/resume-optimizer
git add landing.html
git commit -m "feat: Add Supabase email capture integration"
git push origin main
```

**Vercel will auto-deploy** in ~30 seconds!

**If deploying from AI-Masterclass repo:**

```bash
git add landing.html
git commit -m "feat: Add Supabase email capture"
git push origin <your-branch>
```

Then trigger Vercel deployment.

---

## Part 8: Verify It Works

### Step 9: Test Live Site

1. Go to https://resume-optimizer.vercel.app
2. Submit a real email
3. Check Supabase Table Editor
4. Verify email appears in database ✅

---

## 🎉 You're Done!

Your landing page now:
- ✅ Captures emails to Supabase database
- ✅ Shows loading state ("Joining...")
- ✅ Handles duplicate emails gracefully
- ✅ Shows success/error messages
- ✅ Tracks referral source automatically
- ✅ Completely free (50,000 rows on free tier)

---

## 📊 View Your Signups

**In Supabase Dashboard:**
1. Go to **Table Editor**
2. Click `waitlist` table
3. See all email signups in real-time!

**Export to CSV:**
1. Click **"⋮"** menu → **"Download as CSV"**
2. Get spreadsheet of all emails

**Set up email notifications (optional):**
1. Use Supabase **Database Webhooks**
2. Trigger Zapier/Make.com when new email added
3. Send yourself notification or add to Mailchimp

---

## 🔧 Troubleshooting

**Problem: "Error saving email"**
- Check browser console (F12) for specific error
- Verify API keys are correct
- Check RLS policy allows INSERT
- Verify table name is exactly `waitlist`

**Problem: "Duplicate key value violates unique constraint"**
- This means email already exists (good!)
- The code should show "You're already on the waitlist"
- If not, check error handling in code

**Problem: "Invalid API key"**
- Double-check you copied the `anon` key (not `service_role`)
- Verify no extra spaces in the key
- Make sure URL has `https://`

**Problem: No data appearing in table**
- Check browser Network tab (F12) for failed requests
- Verify RLS policy is enabled and allows INSERT
- Test in Supabase SQL Editor:
  ```sql
  INSERT INTO waitlist (email) VALUES ('test@example.com');
  ```

---

## 🚀 Next Steps

**After collecting 50+ emails:**

1. **Validate demand** - You have proof people want this!
2. **Start building MVP** - Time to make the real product
3. **Email your waitlist** - Keep them updated on progress
4. **Offer early bird pricing** - Reward early supporters

**Email your waitlist:**
- Use Supabase + Resend API
- Or export CSV → import to Mailchimp/ConvertKit
- Send updates every 1-2 weeks

---

## 📚 Resources

- **Supabase Docs**: https://supabase.com/docs
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript/introduction

---

**Need help?** Check the Supabase community at https://github.com/supabase/supabase/discussions

Good luck! 🎉
