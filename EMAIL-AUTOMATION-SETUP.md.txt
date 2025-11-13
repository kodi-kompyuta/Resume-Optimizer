# 📧 Email Automation Setup Guide
## Resend + Supabase + Vercel

Automatically send welcome emails to everyone who joins your waitlist!

---

## 🎯 What You'll Build

**Automated Flow:**
1. User signs up on landing page
2. Email saved to Supabase
3. Supabase webhook triggers Vercel function
4. Resend sends welcome email instantly ✨

**Welcome Email Includes:**
- Personal greeting
- Early bird discount code (EARLYBIRD50)
- What to expect next
- Call-to-action
- Request for feedback

---

## 📋 Prerequisites

- ✅ Supabase project (you already have this)
- ✅ Vercel project (you already have this)
- ⏳ Resend account (we'll create this)

---

## Part 1: Create Resend Account (5 minutes)

### Step 1: Sign Up

1. Go to: **https://resend.com**
2. Click **"Start Building"**
3. Sign up with **GitHub** (recommended)
4. Verify your email

### Step 2: Get API Key

1. In Resend dashboard, click **"API Keys"**
2. Click **"Create API Key"**
3. Name it: `resume-optimizer-production`
4. **Copy the API key** (starts with `re_...`)
   - ⚠️ **SAVE THIS!** You can only see it once
   - Example: `re_123abc...`

### Step 3: Verify Email Domain (Optional but Recommended)

**For now, use Resend's test domain:**
- Emails will come from: `onboarding@resend.dev`
- Works great for testing
- **100 emails/day free**

**Later, verify your own domain:**
- Buy domain (e.g., `resumeoptimizer.com`)
- Add DNS records in Resend
- Send from: `hello@resumeoptimizer.com`
- Looks more professional

---

## Part 2: Add Files to Your Repo (10 minutes)

### Step 4: Add New Files

You need to add these files to your **resume-optimizer** GitHub repo:

**1. Create `api` folder and add `send-welcome-email.js`**

File: `api/send-welcome-email.js`

This file is already created in AI-Masterclass repo. Download it from:
https://github.com/kodi-kompyuta/AI-Masterclass/blob/claude/credits-usage-guide-011CV3iLxzxna6P25WVm6Qsc/api/send-welcome-email.js

**2. Add `package.json`**

File: `package.json`

Download from:
https://github.com/kodi-kompyuta/AI-Masterclass/blob/claude/credits-usage-guide-011CV3iLxzxna6P25WVm6Qsc/package-resume-optimizer.json

Save as `package.json` (rename it)

**Upload to GitHub:**
1. Go to: https://github.com/kodi-kompyuta/resume-optimizer
2. Create folder: Click "Add file" → Create new file
3. Name it: `api/send-welcome-email.js` (folder will be created automatically)
4. Paste the code
5. Commit
6. Then upload `package.json` to root directory

---

## Part 3: Configure Vercel (5 minutes)

### Step 5: Add Environment Variable

1. Go to: **https://vercel.com/dashboard**
2. Click your **resume-optimizer** project
3. Click **"Settings"** → **"Environment Variables"**
4. Add new variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (the `re_...` string you copied)
   - **Environment**: Production, Preview, Development (check all)
5. Click **"Save"**

### Step 6: Redeploy

After adding the environment variable:
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on latest deployment
   - OR just push any change to GitHub (auto-deploys)
3. Wait for deployment to finish

---

## Part 4: Set Up Supabase Webhook (5 minutes)

### Step 7: Create Database Webhook

1. Go to: **https://supabase.com/dashboard**
2. Select your project
3. Go to **"Database"** → **"Webhooks"** (in left sidebar)
4. Click **"Create a new webhook"**

**Configure webhook:**
- **Name**: `send-welcome-email`
- **Table**: `waitlist`
- **Events**: Check ✓ **Insert** only
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://resume-optimizer.vercel.app/api/send-welcome-email`
  - Replace with your actual Vercel URL if different
- **HTTP Headers**: (leave default)
  - Content-Type: application/json
- **Timeout**: 5000ms (default)

5. Click **"Create webhook"**

---

## Part 5: Test It! (2 minutes)

### Step 8: Submit Test Email

1. Go to: https://resume-optimizer.vercel.app
2. Submit a test email (use your real email to see the result)
3. Watch for success message
4. **Check your inbox!** 📧
   - Should receive welcome email within seconds
   - Check spam folder if not in inbox

### Step 9: Verify in Logs

**Check Vercel logs:**
1. Vercel Dashboard → Your project → **"Logs"**
2. Look for successful API calls
3. Should see: `Email sent successfully`

**Check Supabase webhook logs:**
1. Supabase → Database → Webhooks
2. Click on your webhook
3. See recent deliveries
4. Should show 200 status (success)

---

## 🎉 You're Done!

Your email automation is live! Every new signup will automatically receive:
- ✅ Welcome email within seconds
- ✅ Early bird discount code
- ✅ Professional, branded email
- ✅ Call-to-action to engage

---

## 📊 Monitor Your Emails

### In Resend Dashboard:

1. Go to **"Logs"** tab
2. See all sent emails
3. Track:
   - Delivered
   - Opened (requires domain verification)
   - Clicked (requires domain verification)
   - Bounced/Failed

### Free Tier Limits:

- **100 emails/day**
- **3,000 emails/month**
- More than enough for validation phase!

---

## 🎨 Customize Your Email

### Edit the Email Template

To customize the welcome email:

1. Edit `api/send-welcome-email.js`
2. Find `getWelcomeEmailHTML()` function
3. Modify the HTML:
   - Change discount code
   - Update copy
   - Add your branding
   - Change colors
4. Push to GitHub → Auto-deploys

### Email Template Variables

Available variables you can use:
- `email` - User's email address
- `signupDate` - When they signed up
- `record.referral_source` - Where they came from

**Example customization:**
```javascript
subject: '🎉 Welcome ${email.split('@')[0]}! You\'re on the list',
```

---

## 🐛 Troubleshooting

### Problem: No email received

**Check:**
1. Spam/junk folder
2. Vercel logs for errors
3. Supabase webhook status (should be 200)
4. Resend API key is correct
5. Email address is valid

**Test webhook manually:**
```bash
curl -X POST https://resume-optimizer.vercel.app/api/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"record": {"email": "test@example.com", "created_at": "2025-01-15"}}'
```

### Problem: Webhook fails (500 error)

- Check Resend API key is set in Vercel environment variables
- Verify `package.json` includes `resend` dependency
- Check Vercel function logs for specific error
- Redeploy after adding environment variables

### Problem: "Method not allowed" (405 error)

- Webhook should use POST method
- Check Supabase webhook configuration
- Verify URL is correct

### Problem: Emails go to spam

**Solutions:**
1. Verify your own domain in Resend (most important)
2. Add SPF, DKIM records (Resend provides these)
3. Avoid spam trigger words in subject line
4. Test with Gmail, which has strictest filters

---

## 🚀 Next Steps

### Once Email Automation Works:

**1. Add More Emails (Drip Campaign)**
- Day 3: "Resume tips while you wait"
- Day 7: "We're almost ready! Beta invite"
- Day 14: "Launch coming soon + exclusive offer"

**2. Segment Your List**
- Add `source` column to track where they came from
- Send targeted emails based on source
- A/B test subject lines

**3. Track Opens & Clicks**
- Verify your domain in Resend
- Enable tracking
- See what content resonates

**4. Export to Email Marketing Tool**
- Export CSV from Supabase
- Import to Mailchimp/ConvertKit for campaigns
- Keep both systems synced

---

## 💡 Email Best Practices

**Subject Lines:**
- Keep under 50 characters
- Use emoji sparingly (1-2 max)
- Create curiosity or urgency
- A/B test different versions

**Content:**
- Keep it short (under 500 words)
- Clear call-to-action
- Mobile-friendly (60% read on mobile)
- Personalize when possible

**Timing:**
- Send within 1 minute of signup (automated ✅)
- Follow-up emails: 3, 7, 14 days
- Don't email more than twice per week

**Deliverability:**
- Verify your domain ASAP
- Keep bounce rate under 5%
- Monitor spam complaints
- Clean your list regularly

---

## 📚 Resources

- **Resend Docs**: https://resend.com/docs
- **Vercel Serverless Functions**: https://vercel.com/docs/functions
- **Supabase Webhooks**: https://supabase.com/docs/guides/database/webhooks
- **Email HTML Templates**: https://reallygoodemails.com

---

## 🎯 Success Metrics

Track these after setup:

- [ ] Emails sent successfully (100% delivery)
- [ ] Open rate (target: 20-30%)
- [ ] Click rate on CTA (target: 5-10%)
- [ ] Reply rate (measure engagement)
- [ ] Unsubscribe rate (keep under 1%)

---

**Congratulations!** You now have professional email automation that will nurture your leads automatically! 🎉

Every signup is now:
1. Saved to database ✅
2. Welcomed via email ✅
3. Given early bird discount ✅
4. Engaged and excited ✅

**Ready to collect those 50+ signups!** 🚀
