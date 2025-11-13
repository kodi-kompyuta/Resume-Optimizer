# 📄 Resume Optimizer

AI-powered resume optimization and cover letter generation tool.

**Live Site:** https://resume-optimizer.vercel.app

---

## 🚀 Features

- **AI Resume Analysis** - Get instant feedback on your resume
- **ATS Optimization** - Beat Applicant Tracking Systems
- **Job Matching** - Tailor your resume to job descriptions
- **Cover Letter Generator** - Create personalized cover letters
- **Email Waitlist** - Collect early access signups

---

## 📦 What's Included

- `landing.html` - Landing page with Supabase email capture
- `vercel.json` - Vercel deployment configuration
- `DEPLOYMENT-GUIDE.md` - Complete Vercel deployment instructions
- `SUPABASE-SETUP.md` - Supabase email capture setup guide

---

## 🎯 Tech Stack

- **Frontend:** Pure HTML/CSS/JavaScript (no dependencies)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Design:** Mobile-responsive, gradient-based UI

---

## 🚀 Quick Start

### 1. Set Up Supabase

Follow the detailed guide in [SUPABASE-SETUP.md](./SUPABASE-SETUP.md):

1. Create Supabase account
2. Create `waitlist` table
3. Set up RLS policies
4. Get API credentials

### 2. Add Credentials

Edit `landing.html` and replace placeholders (around line 850):

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Deploy to Vercel

See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for full instructions:

1. Push code to GitHub
2. Import repo to Vercel
3. Deploy (auto-deploys in 30 seconds)

---

## 📊 View Signups

Go to your Supabase dashboard → Table Editor → `waitlist` table to see all email signups in real-time.

Export to CSV anytime for email campaigns.

---

## 🎨 Design

- **Primary Color:** Blue (#2563eb)
- **Gradient:** Purple (#667eea → #764ba2)
- **Font:** Inter
- **Responsive:** Mobile-first design

---

## 📝 Project Structure

```
resume-optimizer/
├── landing.html           # Main landing page
├── vercel.json           # Vercel routing config
├── DEPLOYMENT-GUIDE.md   # Deployment instructions
├── SUPABASE-SETUP.md     # Supabase setup guide
└── README.md             # This file
```

---

## 🔮 Roadmap

**Phase 1: Validation (Current)**
- ✅ Landing page
- ✅ Email capture
- ✅ Deployed to Vercel
- ⏳ Collect 50+ signups

**Phase 2: MVP Development**
- Resume upload (PDF/DOCX)
- AI analysis with Claude
- ATS scoring algorithm
- Basic optimization suggestions

**Phase 3: Full Product**
- Job description matching
- Cover letter generation
- User accounts
- Payment integration

---

## 🤝 Contributing

This is a solo project, but feedback and suggestions are welcome!

---

## 📄 License

MIT License - feel free to learn from this code!

---

## 📞 Support

For questions or issues:
- Check the setup guides in this repo
- Review Supabase documentation
- Check Vercel deployment logs

---

**Built with ❤️ for job seekers**

*Last updated: January 2025*
