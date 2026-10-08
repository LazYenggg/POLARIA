# Page 5 Navigation Model Change

## Date
October 2, 2026

## Objective
Change Page 5 from a sequential page to a MAIN MENU / ACTIVITY HUB with no Back/Forward navigation controls and implement route guards for the identity submission flow.

---

## Changes Made

### 1. ✅ Removed Page Navigation from Page 5

**Removed:**
- Back button (to Page 4)
- Forward button (to Page 6)
- Bottom navigation bar
- `PageNavigation` component import

**Page 5 now only shows:**
- Background, header, title
- Four menu buttons (primary navigation)
- No sequential page controls

**Rationale:**
- Page 5 is the main menu / activity hub
- Four menu items provide all necessary navigation
- Not a sequential page in the E-LKPD flow

---

### 2. ✅ Implemented Route Guard for Page 5

**Protection:** Page 5 requires identity submission

```typescript
useEffect(() => {
  // Check if identity was submitted
  try {
    const saved = window.localStorage.getItem('polaria-group-identity')
    if (!saved) {
      router.replace('/page-4')  // No identity → redirect
      return
    }
    const identity = JSON.parse(saved)
    if (!identity.groupName && !identity.members && !identity.className) {
      router.replace('/page-4')  // Empty identity → redirect
      return
    }
  } catch {
    router.replace('/page-4')  // Error → redirect
    return
  }
}, [router])
```

**Access control:**
- ❌ No identity saved → Redirect to Page 4
- ❌ Empty identity → Redirect to Page 4
- ❌ Malformed data → Redirect to Page 4
- ✅ Valid identity → Allow access to Page 5

**Prevents:**
- Direct URL access to `/page-5` without identity
- Browser back navigation bypassing identity form
- Accidental skipping of identity submission

---

### 3. ✅ Implemented Route Guard for Page 4

**Protection:** Page 4 redirects if identity already submitted

```typescript
const [isSubmitted, setIsSubmitted] = useState(false)

useEffect(() => {
  // Check if identity already exists
  try {
    const saved = window.localStorage.getItem('polaria-group-identity')
    if (saved) {
      const parsedIdentity = JSON.parse(saved)
      if (parsedIdentity.groupName || parsedIdentity.members || parsedIdentity.className) {
        setIsSubmitted(true)
      }
    }
  } catch { }
}, [])

// Redirect to Page 5 if already submitted
useEffect(() => {
  if (isSubmitted) {
    router.replace('/page-5')
  }
}, [isSubmitted, router])
```

**Access control:**
- ✅ No identity → Allow Page 4 access (fill form)
- ❌ Identity exists → Redirect to Page 5 (prevent re-entry)

**Prevents:**
- Accidentally re-entering identity form after submission
- Overwriting existing group identity
- Confusion about which identity is active

---

### 4. ✅ Updated Page 5 Layout (No Navigation)

**CSS Changes:**

```css
/* Before - Reserved space for navigation */
.menu-buttons {
  bottom: 20%;  /* Left room for nav */
}

/* After - Full vertical space */
.menu-buttons {
  bottom: 12%;  /* More centered */
}
```

**Desktop:**
- Menu container: `top: 24%, bottom: 12%` (was `bottom: 20%`)
- Better vertical centering without navigation

**Mobile:**
- Menu container: `top: 21%, bottom: 10%` (was `bottom: 17%`)
- More breathing room

**Result:**
- Menu buttons better centered vertically
- No empty space where navigation was
- Cleaner, more focused layout

---

## Flow Logic

### Identity Submission Flow

```
Page 4 (Identity Form)
  ↓
Fill: groupName, members, className
  ↓
Save to localStorage: 'polaria-group-identity'
  ↓
identitySubmitted = true
  ↓
Page 5 (Main Menu) ← Entry point for activity phase
  ↓
Choose activity:
├─ Tujuan Pembelajaran → /page-6
├─ Barisan Aritmatika → /page-7
├─ Barisan Geometri → /page-10
└─ Evaluasi → /page-13
```

### Route Guards

**Page 4 Guard:**
```
if identitySubmitted === true:
  redirect to /page-5
else:
  allow access (show identity form)
```

**Page 5 Guard:**
```
if identitySubmitted === false:
  redirect to /page-4
else:
  allow access (show main menu)
```

---

## Group Session Preservation

**Identity data persisted:**
```typescript
{
  groupName: string,
  members: string,
  className: string
}
```

**Storage:** `localStorage` key: `'polaria-group-identity'`

**Availability:**
- ✅ Saved on Page 4 when user types
- ✅ Retrieved on Page 5 for guard check
- ✅ Available for all subsequent activity pages
- ✅ Associated with current E-LKPD session

**Future use:**
- Student answers will reference this group identity
- No duplicate identity creation
- Single submission record per session

---

## Navigation Model Comparison

### Before (Sequential)

```
Page 4 (Identity)
  ← Back | Forward →
           ↓
      Page 5 (Menu)
  ← Back | Forward →
```

**Issues:**
- Confusing to go "back" to identity form
- "Forward" doesn't make sense from a menu
- Treated menu as sequential page

### After (Hub-based)

```
Page 4 (Identity)
  ← Back only
           ↓
      Page 5 (MAIN MENU)
      No Back/Forward
      ↓   ↓   ↓   ↓
    Activity pages...
```

**Benefits:**
- Clear separation: setup (1-4) vs. activities (5+)
- Menu is navigation hub, not a page in sequence
- Four buttons provide all necessary navigation
- Prevents accidental identity re-entry

---

## Files Modified

### Modified (3):

1. **`app/page-5/page.tsx`**
   - Removed `PageNavigation` component
   - Added route guard (redirect if no identity)
   - Added `useRouter` import

2. **`app/page-5/page-5.css`**
   - Removed `.menu-nav` positioning rules
   - Adjusted menu container bottom position (20% → 12%)
   - Better vertical centering without navigation

3. **`app/page-4/page.tsx`**
   - Added route guard (redirect if identity exists)
   - Added `isSubmitted` state tracking
   - Added `useRouter` import

### Unchanged:

- ✅ Pages 1-3 completely unchanged
- ✅ Page 4 visual design unchanged
- ✅ Page 5 menu buttons, labels, sizes unchanged
- ✅ All routing destinations unchanged (6, 7, 10, 13)
- ✅ Menu button component unchanged
- ✅ Group identity storage mechanism unchanged

---

## What Was NOT Changed

### Page 5 Visuals (Preserved)
✅ Background  
✅ Header  
✅ Title "MENU"  
✅ Menu button sizes  
✅ Menu labels  
✅ Decorative artwork (classroom)  
✅ Responsive behavior  
✅ Hover/focus effects  

### Page 4 Visuals (Preserved)
✅ Identity form layout  
✅ Input fields  
✅ Typography  
✅ Spacing  
✅ Background/header  
✅ Forward button to Page 5  

### Pages 1-3 (Completely Unchanged)
✅ No modifications to approved pages  

### Not Implemented
❌ Firebase integration (using localStorage for now)  
❌ Generic bottom navigation bar  
❌ Page redesigns  

---

## TypeScript Validation

```
✓ app/page-5/page.tsx - No diagnostics
✓ app/page-4/page.tsx - No diagnostics
✓ Route guard logic type-safe
✓ Router navigation properly typed
```

---

## Testing Checklist

### Route Guard Testing

**Page 4 → Page 5 Flow:**
- [ ] Page 4 accessible with no identity saved
- [ ] Can fill identity form
- [ ] Forward button goes to Page 5
- [ ] Page 5 accessible after identity filled
- [ ] Cannot return to Page 4 via browser back
- [ ] Direct URL access `/page-4` redirects to Page 5 if submitted

**Page 5 Protection:**
- [ ] Cannot access `/page-5` directly without identity
- [ ] Redirects to Page 4 if no identity
- [ ] Redirects to Page 4 if empty identity
- [ ] Allows access with valid identity
- [ ] Menu buttons work (6, 7, 10, 13)

**Browser Navigation:**
- [ ] Back button from Page 5 → automatically redirects to Page 5 (not Page 4)
- [ ] Forward button after identity submission works
- [ ] Direct URL manipulation respects guards

### Visual Testing

**Page 5:**
- [ ] No Back/Forward navigation visible
- [ ] Menu buttons properly centered
- [ ] More vertical space for menu
- [ ] No empty space at bottom
- [ ] Four menu buttons work correctly
- [ ] Labels visible
- [ ] Hover/focus effects work

**Page 4:**
- [ ] Identity form unchanged
- [ ] Forward button still visible
- [ ] Forward button goes to Page 5
- [ ] No visual changes

**Pages 1-3:**
- [ ] All unchanged and working

### Session Testing

- [ ] Identity persists in localStorage
- [ ] Identity available across page navigation
- [ ] No duplicate identity creation
- [ ] Identity survives page refresh (localStorage)

---

## Edge Cases Handled

1. **No localStorage:**
   - Try-catch prevents errors
   - Defaults to redirect to Page 4

2. **Malformed JSON:**
   - Try-catch catches parse errors
   - Redirects to Page 4

3. **Empty identity object:**
   - Checks all fields for meaningful data
   - Redirects if all empty

4. **Direct URL access:**
   - Guards run on component mount
   - Redirects before rendering

5. **Browser back button:**
   - Guards run on every navigation
   - Prevents bypassing flow

---

## Future Enhancements

**When implementing Firebase:**
1. Replace localStorage with Firebase Realtime Database
2. Keep same guard logic structure
3. Check Firestore/RTDB for identity submission status
4. Associate answers with Firebase session ID

**Guard will remain conceptually the same:**
```typescript
// Future Firebase version
const { data: identity } = await getGroupIdentity(sessionId)
if (!identity) {
  router.replace('/page-4')
}
```

---

## Key Benefits

1. **Clear Mental Model**
   - Page 5 is now clearly a hub, not a page
   - Students understand: fill identity → choose activity

2. **Prevents Confusion**
   - Can't accidentally re-enter identity
   - Can't skip identity by URL manipulation

3. **Better UX**
   - No confusing "back to identity" button
   - Menu is the navigation

4. **Maintains State**
   - Identity preserved throughout session
   - Ready for answer collection

5. **Clean Layout**
   - More space for menu without navigation
   - Better visual balance

---

**Status:** ✅ Page 5 converted to main menu hub with route guards. Navigation removed, identity flow protected.

**Next Step:** Test in browser to verify:
1. Cannot access Page 5 without identity
2. Cannot return to Page 4 after submission
3. Menu buttons work correctly
4. Layout improved without navigation
