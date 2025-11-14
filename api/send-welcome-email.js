// Vercel Serverless Function for Sending Welcome Emails
// Triggered by Supabase Database Webhook when new email added to waitlist

const { Resend } = require('resend');

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the webhook payload from Supabase
    const { record } = req.body;

    if (!record || !record.email) {
      return res.status(400).json({ error: 'Missing email in request' });
    }

    const userEmail = record.email;
    const signupDate = new Date(record.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send welcome email via Resend
    const data = await resend.emails.send({
      from: 'Resume Optimizer <onboarding@resend.dev>', // Change this after domain verification
      to: [userEmail],
      subject: '🎉 Welcome to Resume Optimizer - You\'re on the Waitlist!',
      html: getWelcomeEmailHTML(userEmail, signupDate),
    });

    console.log('Email sent successfully:', data);
    return res.status(200).json({ success: true, emailId: data.id });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}

// HTML Email Template
function getWelcomeEmailHTML(email, signupDate) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Resume Optimizer</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .discount-code {
      background: #fffbeb;
      border: 2px dashed #f59e0b;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .discount-code code {
      background: #fef3c7;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 20px;
      font-weight: 700;
      color: #92400e;
      letter-spacing: 2px;
    }
    .feature-list {
      list-style: none;
      padding: 0;
    }
    .feature-list li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .feature-list li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
      margin-top: 20px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to Resume Optimizer!</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">You're officially on the waitlist</p>
  </div>

  <div class="content">
    <div class="badge">✨ Early Access Member</div>

    <p>Hi there! 👋</p>

    <p>Thank you for joining the Resume Optimizer waitlist! You're now part of an exclusive group of job seekers who'll get first access to our AI-powered resume optimization tool.</p>

    <div class="discount-code">
      <p style="margin: 0 0 10px 0; font-weight: 600;">🎁 Your Early Bird Discount Code:</p>
      <code>EARLYBIRD50</code>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Save 50% when we launch!</p>
    </div>

    <h2 style="color: #1e293b; margin-top: 30px;">What You'll Get:</h2>
    <ul class="feature-list">
      <li><strong>AI-Powered Analysis:</strong> Instant resume scoring and feedback</li>
      <li><strong>ATS Optimization:</strong> Beat Applicant Tracking Systems</li>
      <li><strong>Job Matching:</strong> Tailor your resume to any job description</li>
      <li><strong>Cover Letters:</strong> Generate personalized cover letters in seconds</li>
      <li><strong>Priority Support:</strong> Get help when you need it most</li>
    </ul>

    <h2 style="color: #1e293b; margin-top: 30px;">📅 What Happens Next?</h2>
    <p>We're working hard to build an amazing product! Here's what to expect:</p>
    <ol>
      <li><strong>Weekly Updates:</strong> We'll share our progress and tips</li>
      <li><strong>Beta Access:</strong> You'll be first to try new features</li>
      <li><strong>Launch Notification:</strong> Be the first to know when we go live</li>
    </ol>

    
    <h2 style="color: #1e293b; margin-top: 30px;">🙋 Quick Question:</h2>
    <p>What's your biggest challenge with your current resume? Just hit reply and let us know! Your feedback helps us build exactly what you need.</p>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px;">
      <p style="margin: 0; font-size: 14px; color: #4b5563;">
        <strong>Pro Tip:</strong> While you wait, make sure your LinkedIn profile is up to date. A strong LinkedIn presence + optimized resume = more interviews! 🚀
      </p>
    </div>
  </div>

  <div class="footer">
    <p><strong>Resume Optimizer</strong></p>
    <p>Signed up: ${signupDate}</p>
    <p>Email: ${email}</p>

    <div class="social-links">
      <a href="https://twitter.com/resumeoptimizer">Twitter</a> •
      <a href="https://linkedin.com/company/resumeoptimizer">LinkedIn</a>
    </div>

    <p style="margin-top: 20px; font-size: 12px;">
      You're receiving this because you signed up at resume-optimizer.vercel.app
    </p>
  </div>
</body>
</html>
  `;
}

