# 🐛 CareOps Frontend - Comprehensive Bug Report

**Date:** February 14, 2026  
**Auditor:** Principal Frontend Developer & Tester  
**Total Issues Found:** 24

---

## 🔴 **CRITICAL ISSUES** (Must Fix Immediately)

### 1. **ProtectedRoute.tsx - Duplicate/Broken Code** ⚠️
**File:** `careops-frontend/components/auth/ProtectedRoute.tsx`  
**Severity:** CRITICAL  
**Lines:** 1-212

**Problem:**
- File has **TWO COMPLETE IMPLEMENTATIONS** overlapping (lines 1-100 and lines 104-162)
- Second implementation is **ORPHANED CODE** not inside any function
- 50+ TypeScript errors due to undefined variables
- Code references variables like `requireAuth`, `user`, `router` that don't exist in scope

**Impact:**
- **Build will fail** in production
- Component is technically broken but still works due to early return
- TypeScript errors prevent proper type checking

**Root Cause:**
Incomplete refactoring - old implementation wasn't removed after adding new one.

**Fix Required:**
Delete lines 104-162 (the orphaned duplicate code).

---

### 2. **Missing Navigation Route - /dashboard/leads** ⚠️
**File:** `careops-frontend/components/dashboard/DashboardLayout.tsx` (line 36)  
**Severity:** CRITICAL

**Problem:**
- Sidebar navigation includes "Leads" → `/dashboard/leads`
- **Page does not exist** (404 error)
- Terminal logs show: `GET /dashboard/leads 404`

**Impact:**
- Users clicking "Leads" get a 404 error
- Navigation badge shows "Users" icon but no destination

**Fix Required:**
Either:
1. Create `app/dashboard/leads/page.tsx` 
2. Remove "Leads" from navigation array (line 36)

---

### 3. **Missing API Routes - Forms Endpoints** ⚠️
**File:** `careops-frontend/app/dashboard/forms/page.tsx` (lines 38-40)  
**Severity:** CRITICAL

**Problem:**
```typescript
const response = await fetch('/api/v1/forms/', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```
- Calls `/api/v1/forms/` endpoint
- **Terminal shows:** `GET /api/v1/forms 404`
- Endpoint doesn't exist in backend or frontend API routes

**Impact:**
- Forms page shows empty state
- Cannot display, create, or manage forms
- Console error on every page load

**Fix Required:**
Either:
1. Create backend route `/api/v1/forms/` in FastAPI
2. Update frontend to call correct backend route `/api/v1/workspaces/{workspace_id}/forms`
3. Add workspace_id to API call

---

### 4. **Missing Static Asset - icon.svg** ⚠️
**Severity:** MEDIUM-HIGH  
**Terminal Log:** `GET /icon.svg 404 in 236ms`

**Problem:**
- Next.js metadata references `/icon.svg`
- File doesn't exist in `public/` folder
- Browser console shows 404 error

**Impact:**
- No favicon displayed
- Missing Open Graph image
- Terminal noise/errors

**Fix Required:**
Create `public/icon.svg` or update metadata to use existing logo.

---

## 🟡 **HIGH PRIORITY ISSUES** (Should Fix Soon)

### 5. **Missing Metadata Configuration**
**Severity:** HIGH  
**Terminal Warning:** `metadataBase property not set for resolving social open graph`

**Problem:**
```typescript
// app/layout.tsx missing:
export const metadata: Metadata = {
  metadataBase: new URL('https://careops.com'), // ← Missing
  // ... rest of metadata
}
```

**Impact:**
- Open Graph images use localhost URLs
- Social media sharing broken
- SEO issues in production

**Fix Required:**
Add `metadataBase` to `app/layout.tsx` metadata export.

---

### 6. **Inconsistent Token Storage**
**Files:** Multiple files  
**Severity:** HIGH

**Problem:**
- `LoginForm.tsx` uses authStore which stores in `localStorage.authToken`
- `forms/page.tsx` (line 40) reads from `localStorage.token`
- `lib/api.ts` (line 40, 49, etc.) reads from `localStorage.token`
- **Three different storage keys**: `authToken`, `token`, and store state

**Impact:**
- After login, forms page cannot authenticate
- API calls fail with 401
- User appears logged in but API rejects requests

**Locations:**
```typescript
// LoginForm.tsx uses:
login(response.user, response.access_token) // Stores as 'authToken'

// forms/page.tsx reads:
const token = localStorage.getItem('token') // ❌ Wrong key

// lib/api.ts reads:
const token = localStorage.getItem('token') // ❌ Wrong key
```

**Fix Required:**
Standardize on ONE token storage location (preferably authStore).

---

### 7. **API Base URL Inconsistency**
**Files:** Multiple files  
**Severity:** HIGH

**Problem:**
- `forms/page.tsx` calls `/api/v1/forms/` (relative URL)
- `lib/api.ts` calls `${API_BASE_URL}/...` (full URL with env var)
- Some components use relative, some use absolute URLs

**Impact:**
- Forms page makes wrong API calls
- Mixing patterns causes confusion
- Hard to configure for different environments

**Fix Required:**
Use `API_BASE_URL` consistently from environment variables.

---

### 8. **Missing Workspace Context**
**Files:** `forms/page.tsx`, `lib/api.ts`, `bookings/page.tsx`  
**Severity:** HIGH

**Problem:**
- Backend API requires `workspace_id` in routes: `/api/v1/workspaces/{workspace_id}/forms`
- Frontend doesn't track or pass workspace context
- API calls missing required path parameters

**Example:**
```typescript
// forms/page.tsx (WRONG):
fetch('/api/v1/forms/') // ❌ Missing workspace_id

// Should be:
fetch(`/api/v1/workspaces/${workspace_id}/forms/`) // ✅
```

**Impact:**
- All API calls fail
- Cannot fetch bookings, forms, contacts
- Dashboard shows no data

**Fix Required:**
Add workspace context to authStore and include in all API calls.

---

### 9. **Broken Chatbot Route Reference**
**Terminal Log:** `GET /chatbot 404 in 47ms`  
**Severity:** MEDIUM-HIGH

**Problem:**
- Something is trying to navigate to `/chatbot`
- Page doesn't exist
- Could be from old navigation or link

**Impact:**
- 404 error if user tries to access
- Terminal noise

**Fix Required:**
Search for `/chatbot` references and either create page or remove links.

---

### 10. **Missing Workspace Settings Sub-Routes**
**Terminal Logs:**
- `GET /dashboard/settings/workspace 404`  
**Severity:** MEDIUM

**Problem:**
- Settings navigation likely has sub-routes that don't exist
- Only `profile` and `integrations` exist
- `workspace` settings page missing

**Impact:**
- Users can't configure workspace settings
- Incomplete feature

**Fix Required:**
Create `app/dashboard/settings/workspace/page.tsx` or remove from navigation.

---

## 🟢 **MEDIUM PRIORITY ISSUES** (Good to Fix)

### 11. **CSS @theme Warning**
**File:** `careops-frontend/app/globals.css` (line 122)  
**Severity:** MEDIUM  
**Error:** `Unknown at rule @theme`

**Problem:**
```css
@theme inline {
  /* theme variables */
}
```
- CSS validator doesn't recognize `@theme`
- Likely Tailwind v4 feature not fully supported

**Impact:**
- VS Code shows error squiggles
- May cause issues with older build tools

**Fix Required:**
Either use standard CSS custom properties or update Tailwind config.

---

### 12. **Middleware Convention Deprecation**
**Terminal Warning:** `The "middleware" file convention is deprecated. Please use "proxy" instead.`  
**Severity:** MEDIUM

**Problem:**
- Next.js 16+ deprecates `middleware.ts` filename
- Should be renamed to `proxy.ts`

**Impact:**
- Will break in future Next.js versions
- Warning noise in terminal

**Fix Required:**
Rename `middleware.ts` to `proxy.ts`.

---

### 13. **Missing Error Handling in Forms Page**
**File:** `careops-frontend/app/dashboard/forms/page.tsx`  
**Severity:** MEDIUM

**Problem:**
```typescript
const fetchForms = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/v1/forms/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setForms(data)
    }
    // ❌ No error handling if !response.ok
  } catch (error) {
    console.error('Failed to fetch forms:', error)
    // ❌ Only logs, doesn't show user error
  }
  setLoading(false)
}
```

**Impact:**
- Silent failures
- Loading spinner never stops on error
- Users don't know why data isn't showing

**Fix Required:**
Add proper error state and user-facing error messages.

---

### 14. **Hardcoded Mock Data**
**Files:** Multiple dashboard pages  
**Severity:** MEDIUM

**Problem:**
- `dashboard/page.tsx` has hardcoded stats, activities, bookings
- `bookings/page.tsx` has hardcoded booking array
- `inbox/page.tsx` likely has hardcoded conversations

**Example:**
```typescript
const stats = [
  { name: 'Total Bookings', value: '48', change: '+12%', ... },
  // ... hardcoded data
]
```

**Impact:**
- Dashboard shows fake data
- Not connected to real backend
- Users think features are working when they're not

**Fix Required:**
Connect to real API endpoints using react-query.

---

### 15. **Missing Loading States**
**Files:** Most pages  
**Severity:** MEDIUM

**Problem:**
- Pages with API calls don't show loading indicators
- No skeleton loaders during fetch
- Forms page has loading state but others don't

**Impact:**
- Blank screen during data fetch
- Poor UX
- Looks like app is broken

**Fix Required:**
Add loading skeletons or spinners to all data-fetching pages.

---

### 16. **No Permission Checks for Staff Role**
**Files:** All dashboard pages  
**Severity:** MEDIUM

**Problem:**
- According to architecture, staff should have limited permissions
- No pages check `user.role` before showing features
- Staff can see all owner-only features

**Example from architecture:**
```
Staff cannot:
- Change system configuration
- Modify automation rules
- Manage integrations
- Update inventory (only view)
```

**Impact:**
- Staff has access to owner-only features
- Security/permission violation

**Fix Required:**
Add role checks: `{user.role === 'owner' && <OwnerOnlyFeature />}`

---

### 17. **Missing Form Validation**
**Files:** Various forms  
**Severity:** MEDIUM

**Problem:**
- Most forms don't have validation
- LoginForm has validation (good!)
- Other forms (bookings, contacts, etc.) don't

**Impact:**
- Can submit empty forms
- No client-side validation feedback
- Poor UX

**Fix Required:**
Add Zod schemas + react-hook-form to all forms.

---

### 18. **Inconsistent Button Styling**
**Files:** Multiple pages  
**Severity:** LOW-MEDIUM

**Problem:**
- Some pages use `<Button>` component from ui/
- Others use `<button>` with inline Tailwind classes
- Inconsistent appearance and hover states

**Example:**
```typescript
// dashboard/page.tsx uses:
<button className="flex items-center...">

// settings/page.tsx uses:
<Button variant="primary">
```

**Impact:**
- Inconsistent UI
- Harder to maintain
- Design system not followed

**Fix Required:**
Use `<Button>` component consistently from `components/ui/`.

---

## 🔵 **LOW PRIORITY ISSUES** (Polish/Cleanup)

### 19. **Console Logs in Production Code**
**Files:** Multiple  
**Severity:** LOW

**Problem:**
```typescript
console.log('[Middleware] Request to:', pathname)
console.error('Failed to fetch forms:', error)
```

**Impact:**
- Exposes internal logic
- Console noise
- Not production-ready

**Fix Required:**
Remove debug console.logs or wrap in `if (process.env.NODE_ENV === 'development')`.

---

### 20. **Unused UI Components**
**Files:** `components/ui/` folder  
**Severity:** LOW

**Problem:**
- Many Shadcn components installed but not used
- `avatar.tsx`, `scroll-area.tsx`, `sheet.tsx`, `separator.tsx`
- Increases bundle size

**Impact:**
- Larger JavaScript bundle
- Slower page loads

**Fix Required:**
Remove unused components or mark as future use.

---

### 21. **Missing TypeScript Types for API Responses**
**Files:** `lib/api.ts`  
**Severity:** LOW

**Problem:**
- Many API functions return `any` or untyped JSON
- No interface definitions for API responses
- Type safety compromised

**Example:**
```typescript
getWorkspace: async (workspaceId: string) => {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`)
  return response.json() // ❌ Returns any
}
```

**Fix Required:**
Define TypeScript interfaces for all API response shapes.

---

### 22. **No Accessibility Attributes**
**Files:** Multiple  
**Severity:** LOW

**Problem:**
- Buttons don't have `aria-label`
- Links don't have descriptive text
- Form inputs missing `aria-describedby` for errors

**Impact:**
- Screen reader users can't use app
- WCAG compliance failed
- Accessibility lawsuit risk

**Fix Required:**
Add ARIA attributes to interactive elements.

---

### 23. **Missing Error Boundaries**
**Severity:** LOW

**Problem:**
- No React Error Boundaries in app
- If component throws, entire app crashes
- No graceful error handling

**Impact:**
- White screen of death on errors
- No error reporting
- Poor UX

**Fix Required:**
Add Error Boundary component to layout.

---

### 24. **Missing Analytics/Monitoring**
**Severity:** LOW

**Problem:**
- No error tracking (Sentry, Rollbar)
- No analytics (Mixpanel, Amplitude)
- No performance monitoring

**Impact:**
- Can't detect production errors
- No user behavior data
- Can't optimize performance

**Fix Required:**
Add error tracking and analytics services.

---

## 📊 **Issue Summary**

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 CRITICAL | 4 | Must fix before release |
| 🟡 HIGH | 6 | Should fix before beta |
| 🟢 MEDIUM | 10 | Good to fix for polish |
| 🔵 LOW | 4 | Nice to have improvements |
| **TOTAL** | **24** | **Issues identified** |

---

## 🎯 **Recommended Fix Priority**

### Week 1 (Critical)
1. Fix ProtectedRoute.tsx duplicate code
2. Create /dashboard/leads page or remove from nav
3. Fix API routes - forms endpoints
4. Fix token storage inconsistency
5. Add workspace context to API calls

### Week 2 (High Priority)
6. Add metadataBase configuration
7. Fix API base URL inconsistency
8. Create missing workspace settings pages
9. Add error handling to forms
10. Connect hardcoded data to real APIs

### Week 3 (Polish)
11. Fix CSS warnings
12. Rename middleware to proxy
13. Add loading states
14. Add permission checks
15. Add form validation

### Week 4 (Cleanup)
16. Remove console logs
17. Add TypeScript types
18. Add accessibility attributes
19. Add error boundaries
20. Set up monitoring

---

## 🔧 **Quick Wins** (Can fix in < 30 minutes)

1. **Delete lines 104-162** from ProtectedRoute.tsx
2. **Remove "Leads"** from navigation array (line 36 of DashboardLayout.tsx)
3. **Create icon.svg** - copy logo to public folder
4. **Add metadataBase** to layout.tsx metadata
5. **Rename middleware.ts** to proxy.ts
6. **Fix token storage** - change all `localStorage.getItem('token')` to use authStore

---

## 📝 **Testing Checklist**

After fixes, test:
- [ ] Login flow works end-to-end
- [ ] All sidebar links navigate successfully (no 404s)
- [ ] Forms page loads data from backend
- [ ] Bookings page shows real data
- [ ] Staff role restrictions work
- [ ] Token persists after page refresh
- [ ] API calls include workspace_id
- [ ] No console errors on any page
- [ ] Mobile responsive works
- [ ] Logout clears all auth state

---

## 🎉 **Conclusion**

**Good News:**
- ✅ Security middleware working
- ✅ Authentication flow functional
- ✅ UI Design system in place
- ✅ Basic pages created

**Needs Work:**
- ❌ API integration incomplete
- ❌ Many 404 errors
- ❌ Hardcoded mock data
- ❌ TypeScript errors present

**Overall Grade:** C+ (Functional but needs polish)

**Estimated Fix Time:** 40-60 hours for all issues

---

*Report generated by Principal Frontend Developer audit on February 14, 2026*
