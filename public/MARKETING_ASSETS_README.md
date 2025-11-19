# 🎨 ResumeAI Marketing Assets

This folder contains ready-to-use marketing materials for promoting the ResumeAI waitlist.

## 📁 Files Included

### 1. `waitlist-poster.html`
**Full-featured web poster with QR code integration**
- **Dimensions**: Responsive (desktop/tablet/mobile)
- **Best for**: Landing pages, email campaigns, website embedding
- **Features**:
  - Hero section with headline
  - Social proof stats
  - Feature cards with icons
  - QR code for mobile signup
  - Promotional banner
  - Call-to-action buttons

### 2. `facebook-ad.html`
**Facebook Ad optimized design (1200x628px)**
- **Dimensions**: 1200 x 628 pixels (Facebook recommended)
- **Best for**: Facebook/Instagram ads, social media posts
- **Features**:
  - Compact layout optimized for ad space
  - QR code in sidebar
  - Eye-catching stats
  - Strong CTA
  - Mobile responsive

---

## 🚀 How to Use

### View the Files

**Option 1: Direct in Browser**
```bash
# Navigate to the public folder
cd D:\Projects\resume-optimizer-app\public

# Open in browser
start waitlist-poster.html
start facebook-ad.html
```

**Option 2: Through Dev Server**
```bash
npm run dev
# Then visit:
# http://localhost:3000/waitlist-poster.html
# http://localhost:3000/facebook-ad.html
```

---

## 📤 Export Options

### For Social Media (Instagram, LinkedIn, Twitter)

**1. Using Browser Screenshot Tool**
```
1. Open the HTML file in browser
2. Right-click → Inspect (F12)
3. Click device toolbar (mobile icon)
4. Set custom dimensions:
   - Instagram Post: 1080 x 1080px
   - Instagram Story: 1080 x 1920px
   - Facebook: 1200 x 628px
   - Twitter: 1200 x 675px
   - LinkedIn: 1200 x 627px
5. Take screenshot
```

**2. Using Print to PDF**
```
1. Press Ctrl+P (Windows) or Cmd+P (Mac)
2. Select "Save as PDF"
3. Adjust margins: None
4. Remove headers/footers
5. Set custom size (optional)
6. Save
```

**3. Using Online Screenshot Tools**
- [Screenshot.guru](https://screenshot.guru/)
- [Web Screenshot](https://web-capture.net/)
- Paste the file:/// URL or deploy to web

### For Print

**Business Cards / Flyers:**
```
1. Open in browser
2. Print to PDF
3. Set paper size to desired dimensions
4. Import into design software (Canva, Photoshop)
5. Print at local print shop
```

---

## 🎨 Customization

### Changing the URL

Both files use this URL: `https://resume-optimizer-theta.vercel.app/`

To change it:

**In waitlist-poster.html:**
```html
<!-- Line 450 - QR Code -->
<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=YOUR_URL_HERE" />

<!-- Line 441 - Button Link -->
<a href="YOUR_URL_HERE" class="cta-button">
```

**In facebook-ad.html:**
```html
<!-- Line 239 - QR Code -->
<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=YOUR_URL_HERE" />

<!-- Line 184 - Button Link -->
<a href="YOUR_URL_HERE" class="cta-button">
```

### Changing Colors

**Primary Brand Colors:**
```css
Primary Blue:   #2563eb
Purple Accent:  #7c3aed
Success Green:  #10b981
Dark Blue:      #1e40af
```

**Find and Replace:**
1. Open HTML file in text editor
2. Find: `#2563eb` → Replace with your primary color
3. Find: `#7c3aed` → Replace with your accent color
4. Find: `#10b981` → Replace with your success color

### Changing Text

Edit the HTML content directly:
- Headlines: Look for `<h1 class="main-headline">` or `<h1 class="headline">`
- Stats: Look for `<div class="stat-number">`
- Features: Look for `<ul class="feature-list">`
- CTA: Look for `<a href="..." class="cta-button">`

---

## 📊 QR Code Integration

### How It Works

Both files use the free QR Code API:
```
https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=YOUR_URL
```

### QR Code Options

**Change Size:**
```html
?size=300x300  <!-- Larger QR code -->
?size=150x150  <!-- Smaller QR code -->
```

**Add Logo/Color (Premium):**
For branded QR codes with logos:
1. Visit [QR Code Generator](https://www.qr-code-generator.com/)
2. Generate custom QR code
3. Download image
4. Replace `<img src="...">` with your local image

**Alternative QR Code Services:**
- [QR Code Monkey](https://www.qrcode-monkey.com/) - Free with logo
- [QRTiger](https://www.qrtiger.com/) - Dynamic QR codes
- [Bitly](https://bitly.com/) - QR codes with analytics

---

## 📱 Social Media Sizes Reference

| Platform | Size (px) | Aspect Ratio |
|----------|-----------|--------------|
| **Facebook Feed** | 1200 x 630 | 1.91:1 |
| **Facebook Ad** | 1200 x 628 | 1.91:1 |
| **Instagram Post** | 1080 x 1080 | 1:1 |
| **Instagram Story** | 1080 x 1920 | 9:16 |
| **Twitter Post** | 1200 x 675 | 16:9 |
| **LinkedIn Post** | 1200 x 627 | 1.91:1 |
| **Pinterest Pin** | 1000 x 1500 | 2:3 |

---

## ✅ Checklist for Launching

- [ ] Test both HTML files in browser
- [ ] Verify QR codes scan correctly
- [ ] Update URL if using custom domain
- [ ] Export images for each social platform
- [ ] Create variations (A/B testing)
- [ ] Test on mobile devices
- [ ] Share on social media
- [ ] Monitor signup conversions

---

## 🎯 Marketing Tips

### Best Platforms for Sharing

1. **LinkedIn** - Professional audience, high conversion
2. **Twitter** - Tech community, viral potential
3. **Facebook Groups** - Job seekers communities
4. **Reddit** - r/resumes, r/jobs, r/careerguidance
5. **Product Hunt** - Launch announcement
6. **Indie Hackers** - Startup community

### Caption Ideas

**LinkedIn:**
```
🚀 Tired of your resume getting rejected by ATS?

We built an AI that:
✓ Scores your resume in real-time
✓ Optimizes for 94% ATS pass rate
✓ Gets you 3x more interviews

Early access: 50% off (Limited spots)
[Link in comments]
```

**Twitter:**
```
Your resume isn't bad.
The ATS system just can't read it.

ResumeAI fixes that:
• 94% ATS pass rate
• AI-powered optimization
• 3x more interviews

50% off early access 👇
```

**Instagram Story:**
```
Swipe up to join 10,000+ job seekers
who landed their dream jobs 💼✨

[Add screenshot of poster with swipe-up link]
```

---

## 🔧 Troubleshooting

**QR Code Not Loading?**
- Check internet connection (uses external API)
- Verify URL is properly encoded
- Try different QR code service

**Layout Broken on Mobile?**
- Clear browser cache
- Check responsive CSS rules
- Test in different browsers

**Colors Look Different?**
- Calibrate monitor
- Export as PNG instead of JPG
- Check color profile settings

---

## 📞 Support

For design customization help or questions:
- Open an issue in the repository
- Contact the development team
- Refer to the main project README

---

## 📄 License

These marketing materials are part of the ResumeAI project.
Feel free to modify and use for promoting your waitlist.

---

**Last Updated**: November 2024
**Version**: 1.0
