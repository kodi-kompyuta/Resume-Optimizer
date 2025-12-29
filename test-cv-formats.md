# CV Format Testing - Will Current Parser Handle These?

## Format 1: Traditional Multi-Line (SHOULD WORK ✅)
```
Senior Software Engineer
Tech Corp Inc.
New York, NY | June 2020 - Present
• Architected microservices platform
• Led team of 5 engineers
```
**Status:** ✅ parseExperienceItem handles this

---

## Format 2: Inline with Pipe Separator (SHOULD WORK ✅)
```
Senior Software Engineer | Tech Corp Inc. | June 2020 - Present
• Architected microservices platform
• Led team of 5 engineers
```
**Status:** ✅ parseExperienceItem handles this

---

## Format 3: Dates First (WILL BREAK ❌)
```
June 2020 - Present
Senior Software Engineer
Tech Corp Inc., New York, NY
• Architected microservices platform
```
**Status:** ❌ Date line treated as date-only job, creates empty title
          Then "Senior Software Engineer" treated as another job

---

## Format 4: No Dates (MIGHT BREAK ⚠️)
```
Senior Software Engineer
Tech Corp Inc.
• Architected microservices platform
• Led team of 5 engineers
```
**Status:** ⚠️ Might work but no dates captured

---

## Format 5: Bullets Before Job Title (WILL BREAK ❌)
```
PROFESSIONAL EXPERIENCE

• Software Engineer at Google (2020-2023): Built search algorithms
• Data Analyst at Facebook (2018-2020): Analyzed user metrics
• Junior Developer at Startup (2016-2018): Full-stack development
```
**Status:** ❌ All bullets treated as achievements, no job separation

---

## Format 6: Table Format (WILL BREAK ❌)
```
2020-2023    Senior Engineer    Tech Corp    • Built platform
2018-2020    Engineer           StartupCo    • Developed features
```
**Status:** ❌ Not designed for table parsing

---

## Format 7: Compact Single Line (MIGHT BREAK ⚠️)
```
Senior Software Engineer, Tech Corp Inc. (June 2020 - Present)
```
**Status:** ⚠️ Might be treated as heading, not job entry

---

## Format 8: Reverse Chronological with Company Headers (WILL BREAK ❌)
```
TECH CORP INC.
Senior Software Engineer | June 2020 - Present
• Architected microservices platform

STARTUP CO.
Software Engineer | Jan 2018 - May 2020
• Built product features
```
**Status:** ❌ Company names treated as section headings

---

## Format 9: Functional Resume (No Companies) (WILL BREAK ❌)
```
LEADERSHIP EXPERIENCE
• Led 10-person engineering team on cloud migration project
• Managed $2M budget for infrastructure modernization

TECHNICAL EXPERIENCE
• Developed microservices architecture using Kubernetes
• Implemented CI/CD pipelines reducing deployment time by 50%
```
**Status:** ❌ No job entries created, all treated as bullet lists

---

## RECOMMENDATION:
Current parser is optimized for Formats 1 & 2 (traditional chronological).
Needs significant refactoring to handle all formats robustly.
