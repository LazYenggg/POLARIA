# Page 5 Menu Asset Background Removal Fix

## Date
October 2, 2026

## Objective
Fix the visible rectangular/background areas around the four menu PNG assets on Page 5 using an improved edge-connected flood-fill algorithm with color-distance tolerance.

---

## Problem Identified

**Visible backgrounds remained around:**
- tujuan_pembelajaran.png
- barisan_aritmatika.png
- barisan_geometri.png
- evaluasi.png

**Root cause:**
- Previous algorithm only checked `RGB > 242` (pure white)
- Off-white, cream, and light gray backgrounds were not removed
- Anti-aliased edge pixels created visible halos
- Not aggressive enough for real-world menu assets

---

## Solution Implemented

### New Algorithm: `removeMenuBackground()`

**Key improvements over previous `removeEdgeWhite()`:**

1. **Background Color Sampling**
   - Samples all 4 corner pixels
   - Calculates average RGB of background
   - Adapts to actual background color (not just white)

2. **Color-Distance Based Detection**
   ```typescript
   const colorDistance = (r, g, b) => {
     const dr = r - bgR
     const dg = g - bgG  
     const db = b - bgB
     return Math.sqrt(dr * dr + dg * dg + db * db)
   }
   ```

3. **Aggressive Tolerance**
   - Primary threshold: `distance < 40` (was effectively ~18 for pure white)
   - Catches off-white, cream, light gray backgrounds
   - Only affects edge-connected pixels

4. **Two-Pass Processing**

   **Pass 1: Flood-fill background removal**
   - Starts from all edge pixels
   - Removes pixels within distance 40 of background color
   - Only processes connected regions
   - Preserves internal artwork

   **Pass 2: Anti-aliased edge cleanup (halo removal)**
   - Scans all remaining pixels near removed areas
   - For pixels with removed neighbors:
     - Distance < 25: Remove completely
     - Distance 25-40: Reduce alpha proportionally
   - Blends edges naturally into background

---

## Technical Details

### Corner Sampling
```typescript
const sampleCorners = [
  { x: 0, y: 0 },                    // Top-left
  { x: width - 1, y: 0 },            // Top-right
  { x: 0, y: height - 1 },           // Bottom-left
  { x: width - 1, y: height - 1 },   // Bottom-right
]

// Average corner colors to estimate background
const bgR = sumR / count
const bgG = sumG / count
const bgB = sumB / count
```

### Edge-Connected Flood-Fill
```typescript
// Only pixels connected to outer edges are processed
// Internal similar-colored pixels are preserved

const isBackground = (idx) => {
  if (alpha === 0) return true
  return colorDistance(r, g, b) < 40  // Aggressive
}

// Start from all edge pixels
for (x = 0; x < width; x++) {
  enqueue(x, 0)              // Top edge
  enqueue(x, height - 1)     // Bottom edge
}
for (y = 1; y < height - 1; y++) {
  enqueue(0, y)              // Left edge
  enqueue(width - 1, y)      // Right edge
}
```

### Halo Removal (Anti-aliasing cleanup)
```typescript
// Second pass: clean edge pixels near removed background

if (hasRemovedNeighbor) {
  const dist = colorDistance(r, g, b)
  
  if (dist < 25) {
    // Very close to background - remove completely
    data[idx + 3] = 0
  } else if (dist < 40) {
    // Somewhat close - reduce alpha to blend
    const alphaReduction = 1 - (dist / 40)
    data[idx + 3] = Math.max(0, alpha * (1 - alphaReduction * 0.7))
  }
}
```

---

## Comparison: Before vs After

### Previous Algorithm (`removeEdgeWhite`)
```typescript
// Only checked pure white
const isEdgeWhite = (point) => {
  return R > 242 && G > 242 && B > 242 && A > 0
}
```

**Limitations:**
- ❌ Missed off-white backgrounds (245, 245, 240)
- ❌ Missed cream backgrounds (255, 252, 245)
- ❌ Missed light gray (240, 240, 240)
- ❌ No color-distance calculation
- ❌ No anti-aliased edge cleanup
- ❌ Left visible halos

### New Algorithm (`removeMenuBackground`)
```typescript
// Uses color distance from sampled background
const isBackground = (idx) => {
  return colorDistance(r, g, b) < 40
}
```

**Improvements:**
- ✅ Adapts to actual background color
- ✅ Catches off-white, cream, light gray
- ✅ Color-distance based (Euclidean)
- ✅ Two-pass edge cleanup
- ✅ Removes visible halos
- ✅ Preserves internal artwork

---

## Applied To

**Only affects Page 5 menu assets:**
- `tujuan_pembelajaran.png`
- `barisan_aritmatika.png`
- `barisan_geomtri.png`
- `evaluasi.png`

**Does NOT affect:**
- Pages 1-4 assets (still use shared `removeEdgeWhite`)
- Page 5 background assets (background.png, header, classroom)
- Any other page assets

**Implementation:**
- Function renamed: `removeEdgeWhite` → `removeMenuBackground`
- Only called in `MenuButton.tsx` component
- Isolated to Page 5 menu buttons

---

## Files Modified

**Modified (1):**
- `components/MenuButton.tsx`
  - Replaced `removeEdgeWhite()` with `removeMenuBackground()`
  - More aggressive background detection
  - Two-pass processing with halo removal
  - Same component interface (no breaking changes)

**Unchanged:**
- ✅ `app/page-5/page.tsx` - No changes
- ✅ `app/page-5/page-5.css` - No changes
- ✅ `components/menu-button.css` - No changes
- ✅ All other pages and components
- ✅ Pages 1-4 completely untouched

---

## What Was NOT Changed

✅ Page 5 layout  
✅ Menu button sizes  
✅ Menu labels  
✅ Menu spacing  
✅ Classroom illustration  
✅ Navigation  
✅ Routing (6, 7, 10, 13)  
✅ Responsive behavior  
✅ Hover/focus effects  
✅ Pages 1-4  

**Only changed:** Background removal algorithm for menu PNGs

---

## Expected Visual Results

### Before Fix
```
┌─────────────────────────┐
│                         │  ← Visible rectangular
│    [menu artwork]       │     background area
│                         │
└─────────────────────────┘
```

### After Fix
```
     [menu artwork]          ← Only artwork visible,
                                natural blend with
                                E-LKPD background
```

**Verification checklist:**
- ✅ No rectangular background visible
- ✅ No white/cream box around artwork
- ✅ No obvious halo around edges
- ✅ Actual artwork intact
- ✅ Internal white details preserved
- ✅ Image proportions unchanged
- ✅ No unintended cropping
- ✅ Menu labels unchanged
- ✅ Routes unchanged

---

## Algorithm Parameters

**Tunable values:**

1. **Background detection threshold: `40`**
   - Higher = more aggressive removal
   - Lower = more conservative, may leave backgrounds
   - Current: 40 (removes most off-white/cream backgrounds)

2. **Complete removal threshold: `25`**
   - Pixels within distance 25 → alpha = 0
   - Very close to background color

3. **Partial alpha reduction: `25-40`**
   - Pixels in this range → reduce alpha proportionally
   - Smooth transition at edges
   - Factor: `0.7` (70% reduction at distance 25)

**Conservative approach:**
- Only removes edge-connected pixels
- Preserves all internal artwork
- Two-pass ensures clean edges without destroying details

---

## TypeScript Validation

```
✓ components/MenuButton.tsx - No diagnostics
✓ Type checking passed
✓ No breaking changes to component interface
```

---

## Testing Checklist

### Visual Verification (Critical)
- [ ] No visible rectangular background around tujuan_pembelajaran
- [ ] No visible rectangular background around barisan_aritmatika
- [ ] No visible rectangular background around barisan_geometri
- [ ] No visible rectangular background around evaluasi
- [ ] No visible white/cream halo around any menu image
- [ ] Artwork blends naturally into E-LKPD background
- [ ] Internal white details preserved (if any)
- [ ] No unintended cropping or distortion

### Functionality Verification
- [ ] All four menu buttons still clickable
- [ ] Labels visible and correct
- [ ] Routes work (6, 7, 10, 13)
- [ ] Hover effects work
- [ ] Focus indicators work
- [ ] No layout changes

### Responsive Verification
- [ ] Desktop: Clean backgrounds removed
- [ ] Mobile: Clean backgrounds removed
- [ ] No new visual issues on any screen size

### Previous Pages Verification
- [ ] Page 1 unchanged and working
- [ ] Page 2 unchanged and working
- [ ] Page 3 unchanged and working
- [ ] Page 4 unchanged and working

---

## Fallback Tolerance Adjustment

**If backgrounds still visible:**

Increase primary threshold in `removeMenuBackground()`:
```typescript
// Change line ~61:
return colorDistance(r, g, b) < 50  // Was 40
```

**If too much artwork removed:**

Decrease primary threshold:
```typescript
return colorDistance(r, g, b) < 30  // Was 40
```

**Current value (40) should work for most cases.**

---

## Algorithm Safety

**Preserves internal artwork by:**
1. Only starting flood-fill from edges
2. Only removing connected regions
3. Never processing isolated internal pixels
4. Using conservative color-distance thresholds
5. Two-pass approach separates background from edges

**Example:**
```
Edge pixels → Background → Artwork
     ↓           ↓           ↓
   Remove     Remove      Preserve
```

Internal white artwork that's NOT connected to edges remains untouched.

---

**Status:** ✅ Improved background removal implemented. Ready for browser verification.

**Next Step:** Test in browser to confirm all menu asset backgrounds are cleanly removed without visible halos or rectangles.
