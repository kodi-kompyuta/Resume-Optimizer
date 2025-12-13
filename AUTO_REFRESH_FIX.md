# Auto-Refresh Fix for Resume Analysis

## Problem

The resume analysis page was getting stuck on "Analyzing Your Resume..." and never automatically updating when the analysis completed. Users had to manually click "Refresh Page" twice to see the results.

## Root Cause

The analyze page (`app/(dashboard)/analyze/[id]/page.tsx`) is a **server component** that only renders once. When the background analysis completes, there was no mechanism to notify the page to refresh and display the results.

## Solution

Implemented **client-side polling** to automatically check for analysis completion and refresh the page when done.

### Components Added

#### 1. AutoRefresh Component (`app/(dashboard)/analyze/[id]/AutoRefresh.tsx`)

A client-side component that:
- Polls the server every 3 seconds to check resume status
- Automatically refreshes the page when status changes to "completed" or "failed"
- Prevents overlapping requests with a checking flag
- Shows a debug indicator in development mode
- Cleans up properly on unmount

**Key Features:**
- ✅ Polls every 3 seconds
- ✅ Starts checking immediately on mount
- ✅ Calls `router.refresh()` when analysis completes
- ✅ Prevents request overlap
- ✅ Continues polling even if individual checks fail
- ✅ Shows polling indicator in dev mode

#### 2. Status Check API (`app/api/resume-status/[id]/route.ts`)

A lightweight API endpoint that:
- Returns only the `status` field (not the entire resume)
- Verifies user authentication
- Ensures user owns the resume
- Efficient with minimal database load

**Endpoint:**
```
GET /api/resume-status/:id
```

**Response:**
```json
{
  "status": "processing" | "completed" | "failed"
}
```

### Files Modified

#### `app/(dashboard)/analyze/[id]/page.tsx`

**Changes:**
1. Added import for `AutoRefresh` component
2. Included `<AutoRefresh resumeId={id} status={resume.status} />` in processing state
3. Updated user messaging to indicate auto-refresh is happening

**Before:**
```tsx
<p className="text-sm text-gray-500">
  You can refresh this page or wait for the analysis to complete.
</p>
```

**After:**
```tsx
<p className="text-sm text-gray-500 mb-2">
  This page will automatically refresh when analysis is complete.
</p>
<p className="text-xs text-gray-400">
  Or you can manually refresh using the button below.
</p>
```

## How It Works

### Flow Diagram

```
1. User uploads resume
   ↓
2. Page redirects to /analyze/:id
   ↓
3. Server renders "processing" state
   ↓
4. AutoRefresh component mounts (client-side)
   ↓
5. Starts polling /api/resume-status/:id every 3 seconds
   ↓
6. Background analysis completes (updates DB)
   ↓
7. Next poll detects status = "completed"
   ↓
8. AutoRefresh calls router.refresh()
   ↓
9. Page re-renders with analysis results
   ✓ Done!
```

### Sequence Diagram

```
User          Page                AutoRefresh         API              Database
 |             |                      |                 |                  |
 |--upload---->|                      |                 |                  |
 |             |                      |                 |                  |
 |             |---redirect to /analyze/:id------------>|                  |
 |             |                      |                 |                  |
 |             |<---render processing state-------------|                  |
 |             |                      |                 |                  |
 |             |---mount------------->|                 |                  |
 |             |                      |                 |                  |
 |             |                      |--check status-->|                  |
 |             |                      |                 |--query status--->|
 |             |                      |                 |<--"processing"---|
 |             |                      |<--"processing"--|                  |
 |             |                      |                 |                  |
 |             |                      |--wait 3s------->|                  |
 |             |                      |                 |                  |
 |             |                      |--check status-->|                  |
 |             |                      |                 |--query status--->|
 |             |                      |                 |<--"completed"----|
 |             |                      |<--"completed"---|                  |
 |             |                      |                 |                  |
 |             |<---router.refresh()--|                 |                  |
 |             |                      |                 |                  |
 |             |---fetch full data------------------->|                  |
 |             |                      |                 |--query resume--->|
 |             |                      |                 |<--full data------|
 |             |<---render results--------------------|                  |
 |             |                      |                 |                  |
 |<--display---|                      |                 |                  |
```

## Benefits

✅ **Better UX**: Users don't need to manually refresh
✅ **Automatic**: Page updates as soon as analysis completes
✅ **Reliable**: Continues polling even if individual requests fail
✅ **Efficient**: Only fetches the status field, not entire resume
✅ **Safe**: Prevents request overlap and memory leaks
✅ **Debuggable**: Shows polling indicator in development mode

## Configuration

### Poll Interval

Currently set to **3 seconds**. Can be adjusted in `AutoRefresh.tsx`:

```tsx
const interval = setInterval(checkStatus, 3000) // Change this value
```

**Recommendations:**
- 3 seconds: Good balance (current setting)
- 2 seconds: More responsive, higher server load
- 5 seconds: Lower server load, slightly slower UX
- Don't go below 1 second (unnecessary load)

### Timeout

Currently, there's no maximum timeout. The component will poll indefinitely until:
- Analysis completes
- Analysis fails
- User navigates away

**To add a timeout:**
```tsx
useEffect(() => {
  const MAX_ATTEMPTS = 60 // 60 attempts × 3 seconds = 3 minutes

  if (attempts >= MAX_ATTEMPTS) {
    // Show timeout message or force refresh
    return
  }

  // ... rest of polling logic
}, [attempts])
```

## Testing

### Manual Test

1. **Upload a resume**
   ```
   Navigate to /upload
   Upload a PDF/DOCX file
   ```

2. **Observe auto-refresh**
   ```
   - Wait on the "Analyzing..." page
   - Watch browser console for logs
   - Page should automatically refresh within 10-30 seconds
   ```

3. **Check dev indicator** (development mode only)
   ```
   - Look for blue box in bottom-right corner
   - Should show polling count incrementing
   ```

### Console Logs

In development, you'll see:
```
AutoRefresh cleanup - stopped polling
Analysis complete, refreshing page...
```

### Network Tab

Check the Network tab in browser DevTools:
```
GET /api/resume-status/:id (every 3 seconds)
Status: 200
Response: {"status": "processing"}
         ↓ (when done)
Response: {"status": "completed"}
         ↓ (triggers refresh)
GET /analyze/:id (full page reload)
```

## Troubleshooting

### Issue: Page still doesn't auto-refresh

**Possible causes:**
1. **API endpoint not working**
   - Check `/api/resume-status/:id` returns 200
   - Verify authentication is working

2. **Analysis not completing**
   - Check server logs for errors in background analysis
   - Verify OpenAI API key is set

3. **Router not refreshing**
   - Check browser console for errors
   - Try clearing browser cache

**Debug steps:**
```tsx
// Add to AutoRefresh.tsx for debugging
console.log('Poll result:', data.status)
console.log('Attempts:', attempts)
console.log('Is checking:', isChecking)
```

### Issue: Too many requests

If you see excessive polling:

1. **Check for multiple AutoRefresh mounts**
   - Ensure component only mounts once
   - Check React Strict Mode isn't causing issues

2. **Verify cleanup is working**
   - Look for "AutoRefresh cleanup" in console when navigating away

3. **Add request throttling**
   ```tsx
   const [lastRequestTime, setLastRequestTime] = useState(0)

   if (Date.now() - lastRequestTime < 3000) {
     return // Skip if less than 3 seconds since last request
   }
   ```

### Issue: Works in dev but not production

**Common causes:**
1. Environment variables not set in production
2. API route not deployed
3. CORS issues
4. Next.js caching too aggressive

**Fix:**
- Ensure `cache: 'no-store'` is set in fetch
- Check production API logs
- Verify route is accessible in production

## Performance Considerations

### Server Load

- Each user on "processing" page = 1 request per 3 seconds
- 100 concurrent users = ~33 requests/second
- Very light queries (status field only)

**Mitigation:**
- Could add Redis cache for status checks
- Could use WebSockets for real-time updates (more complex)
- Could increase poll interval slightly

### Client Performance

- Minimal JavaScript overhead
- No memory leaks (proper cleanup)
- Stops polling when navigating away

## Future Enhancements

### 1. WebSocket Support (Real-time)

Instead of polling, use WebSockets:

```tsx
const ws = new WebSocket(`/api/ws/resume/${resumeId}`)
ws.onmessage = (event) => {
  if (event.data === 'completed') {
    router.refresh()
  }
}
```

**Pros:** True real-time, no polling overhead
**Cons:** More complex infrastructure, requires WebSocket server

### 2. Server-Sent Events (SSE)

```tsx
const eventSource = new EventSource(`/api/events/resume/${resumeId}`)
eventSource.onmessage = (event) => {
  if (event.data === 'completed') {
    router.refresh()
  }
}
```

**Pros:** Built into HTTP, simpler than WebSockets
**Cons:** One-way communication only

### 3. Progressive UI Updates

Show live progress during analysis:

```tsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className="bg-blue-600 h-2 rounded-full transition-all"
    style={{ width: `${progress}%` }}
  />
</div>
```

### 4. Exponential Backoff

Reduce polling frequency over time:

```tsx
const getInterval = (attempts: number) => {
  return Math.min(3000 * Math.pow(1.5, attempts / 10), 10000)
}
```

## Summary

The auto-refresh fix solves the stuck analysis page issue by:

1. ✅ Polling server every 3 seconds
2. ✅ Auto-refreshing when analysis completes
3. ✅ Maintaining good UX with clear messaging
4. ✅ Being efficient and reliable
5. ✅ Providing debug tools in development

**No user action required** - the page now updates automatically! 🎉
