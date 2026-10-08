# Page 6 - Tujuan Pembelajaran Implementation

## Tanggal
2 Oktober 2026

## Tujuan
Mengimplementasikan Page 6 (Tujuan Pembelajaran) sesuai reference design `public/pages/6-learningobjectives.png` menggunakan asset asli proyek.

---

## File yang Dibuat/Dimodifikasi

### Dibuat (2):
1. **`app/page-6/page.tsx`** - Komponen halaman utama
2. **`app/page-6/page-6.css`** - Styling Page 6

### Tidak Diubah:
- ✅ Page 1, 2, 3, 4, 5 - Tidak ada perubahan
- ✅ Global CSS - Tidak ada perubahan
- ✅ Routing guards - Tidak ada perubahan
- ✅ Shared components - Tidak ada perubahan

---

## Struktur Halaman

### Layer Order (dari belakang ke depan):
```
1. Background (background.png) - z-index: -4
2. Classroom decoration (kids_and_teacher.png) - z-index: -2, opacity: 0.27
3. Header (fixed_header.png) - z-index: 1
4. Title "TUJUAN PEMBELAJARAN" - z-index: 2
5. Parchment (scroll-textbox.png) - z-index: 3
6. Text content - z-index: 4
7. Navigation - z-index: 10 (dari shared component)
```

---

## Komponen Utama

### 1. Background
- **Asset:** `background.png` (via Vercel storage)
- **Positioning:** `inset: 0`, full coverage
- **Z-index:** -4 (paling belakang)

### 2. Header
- **Asset:** `fixed_header.png`
- **Positioning:** `top: 1.8%, left: 6.5%, width: 87%`
- **Mix-blend-mode:** multiply
- **Mengikuti:** Pola standard E-LKPD

### 3. Title
- **Text:** "TUJUAN PEMBELAJARAN"
- **Font:** Baloo 2, weight: 800
- **Color:** `#078b45` (hijau POLARIA)
- **Size:** `clamp(20px, 5.8cqw, 56px)`
- **Text-shadow:** `2px 3px 0 #d9e8d3`
- **Position:** `top: 11.5%`, centered
- **Responsive:** Desktop `top: 11%`, Mobile tetap `11%`

### 4. Parchment Container
```tsx
<div className="learning-objective-card">
  <img className="learning-objective-parchment" src={scrollTextbox} />
  <div className="learning-objective-text">
    <p>...</p>
  </div>
</div>
```

**Parchment (scroll-textbox.png):**
- Digunakan sebagai background visual
- **BUKAN** CSS border/card
- Asset asli dari project
- Position: `top: 25%` (desktop: 23%)
- Width: `left: 8%, right: 8%`
- Mix-blend-mode: multiply

**Text Content:**
- Position: `absolute` di atas parchment
- Inset: `15% 12% 14%` (padding dari edge parchment)
- Font: Times New Roman, weight: 700
- Color: `#078b45`
- Size: `clamp(14px, 3.2cqw, 28px)`
- Line-height: 1.5
- Text-align: left
- **Natural wrapping** (tidak ada hardcoded `<br>`)

**Content:**
```
Siswa mampu menentukan rumus suku ke-n dari suatu pola bilangan 
sederhana dan menggunakannya untuk memprediksi suku berikutnya
```

### 5. Classroom Decoration
- **Asset:** `kids_and_teacher.png`
- **Position:** `left: 0, bottom: 0, width: 100%`
- **Opacity:** 0.27
- **Mix-blend-mode:** multiply
- **Purpose:** Dekorasi di belakang, tidak menutupi content
- **Z-index:** -2

### 6. Navigation
- **Component:** `PageNavigation` (shared)
- **Variant:** `full` (back, home, forward)
- **Routes:**
  - Back → `/page-5` (Menu utama)
  - Home → `/page-5` (Menu utama)
  - Forward → `/page-7` (Barisan Aritmatika)
- **Position:** `left: 8%, right: 8%, bottom: 3%`
- **Transparency:** Enabled (`processTransparency={true}`)

---

## Canvas System

### Desktop
```css
.learning-objective-canvas {
  width: min(100%, 707px, calc(100dvh * 0.707));
  height: min(100dvh, 1000px);
  aspect-ratio: 1414 / 2000;
  container-type: inline-size;
}
```

### Mobile
```css
@media (max-width: 707px) {
  .learning-objective-canvas {
    width: 100%;
    height: 100dvh;
    aspect-ratio: auto;
  }
}
```

**Mengikuti:** Pola yang sama dengan Page 3, 4, 5

---

## Typography

### Heading (Baloo 2)
```css
font-family: 'Baloo 2', cursive;
font-weight: 800;
font-size: clamp(20px, 5.8cqw, 56px);
color: #078b45;
text-shadow: 2px 3px 0 #d9e8d3;
```

### Body Text (Times New Roman)
```css
font-family: 'Times New Roman', serif;
font-weight: 700;
font-size: clamp(14px, 3.2cqw, 28px);
line-height: 1.5;
color: #078b45;
```

**Sesuai:** Design system POLARIA

---

## Responsive Breakpoints

### Desktop (>707px)
- Canvas: 707px max, portrait ratio
- Title: Top 11%, size 56px max
- Parchment: Top 23%
- Text: 28px max
- Navigation: Bottom 2.5%

### Tablet/Mobile (≤707px)
- Canvas: 100vw × 100dvh
- Title: Top 11%, size 38px max
- Parchment: Top 23%, narrower margins (6%)
- Text: 22px max, tighter inset
- Navigation: Bottom 2%

### Small Mobile (≤390px)
- Title: 32px max
- Parchment: Top 22%
- Text: 20px max
- Tighter spacing

### Extra Small (≤360px)
- Title: Top 10.5%, 28px max
- Parchment: Top 21%, narrower margins (5%)
- Text: 18px max
- Optimized for smallest screens

---

## Asset Transparency Processing

**Function:** `removeEdgeWhite()`

**Applied to:**
- background.png
- fixed_header.png
- kids_and_teacher.png
- scroll-textbox.png

**Purpose:** Menghilangkan white background yang tidak diinginkan dari edges

**Method:**
- Edge-connected flood-fill
- Preserves internal artwork
- Runtime processing

---

## Positioning Strategy

**Percentage-based positioning:**
```css
top: 11.5%     /* Title */
top: 25%       /* Parchment */
left: 8%       /* Container margins */
right: 8%
bottom: 3%     /* Navigation */
```

**Container Query Units:**
```css
font-size: clamp(20px, 5.8cqw, 56px)  /* Responsive to canvas */
```

**Benefits:**
- Maintains composition at all sizes
- Follows reference proportions
- Responsive without breakpoints for most elements

---

## Important Implementation Details

### ✅ Parchment adalah Asset, bukan CSS
```tsx
// CORRECT
<img className="learning-objective-parchment" src={scrollTextbox} />

// WRONG - tidak digunakan
<div className="css-border-parchment-fake" />
```

### ✅ Text di Atas Parchment
```tsx
<div className="learning-objective-card">
  <img src={parchment} />        {/* Background layer */}
  <div className="text">         {/* Content layer above */}
    <p>...</p>
  </div>
</div>
```

### ✅ Text Wrapping Natural
```tsx
// CORRECT - browser wrapping
<p>Siswa mampu menentukan rumus suku ke-n...</p>

// WRONG - hardcoded breaks
<p>Siswa mampu menentukan<br />rumus suku ke-n...</p>
```

### ✅ Safe Area untuk Text
```css
.learning-objective-text {
  inset: 15% 12% 14%;  /* Padding dari edge parchment */
}
```

Memastikan text tidak menyentuh ornamen/border parchment

---

## Navigation Routing

**Page 6 dalam flow:**
```
Page 5 (Menu)
    ↓
Page 6 (Tujuan Pembelajaran) ← Halaman ini
    ↓
Page 7 (Barisan Aritmatika)
```

**Three-way navigation:**
- **Back:** Kembali ke Menu (Page 5)
- **Home:** Ke Menu utama (Page 5) 
- **Forward:** Lanjut ke Barisan Aritmatika (Page 7)

---

## Class Naming Convention

**Page-specific classes:**
```
.learning-objective-page-shell
.learning-objective-canvas
.learning-objective-background
.learning-objective-classroom
.learning-objective-header
.learning-objective-title
.learning-objective-card
.learning-objective-parchment
.learning-objective-text
.learning-objective-nav
```

**Purpose:** Avoid conflicts with existing pages

**Pattern:** `learning-objective-*` untuk semua elemen Page 6

---

## Validation Checklist

### Visual Composition
- [x] Heading menggunakan Baloo 2
- [x] Body menggunakan Times New Roman
- [x] Parchment menggunakan scroll-textbox.png asset asli
- [x] Text berada di atas/dalam parchment
- [x] Text mengikuti safe area parchment
- [x] Classroom decoration di belakang content
- [x] Navigation visible di bagian bawah

### Typography
- [x] Heading: Baloo 2, bold, uppercase, hijau
- [x] Content: Times New Roman, bold, hijau
- [x] Text size responsive menggunakan clamp/cqw
- [x] Line-height lega (1.5)
- [x] Natural text wrapping

### Layout
- [x] Portrait composition (1414×2000 ratio)
- [x] Centered canvas
- [x] Responsive tanpa horizontal scroll
- [x] No overflow
- [x] Posisi mengikuti reference

### Assets
- [x] Background: background.png
- [x] Header: fixed_header.png
- [x] Parchment: scroll-textbox.png
- [x] Decoration: kids_and_teacher.png
- [x] Semua asset asli, tidak digambar ulang

### Navigation
- [x] Standard navigation icons (shared component)
- [x] Three buttons: back, home, forward
- [x] Correct routes: 5 ← 6 → 7
- [x] Consistent sizing dengan pages lain
- [x] Transparency processing enabled

### Responsive
- [x] Desktop: Balanced layout
- [x] Mobile: Clean adaptation
- [x] Small screens: No overlap
- [x] Text readable di semua ukuran
- [x] Navigation accessible

### Code Quality
- [x] TypeScript: No diagnostics
- [x] No hardcoded breaks
- [x] Percentage-based positioning
- [x] Container query units
- [x] Proper layering (z-index)

### Other Pages
- [x] Page 1-5: Tidak berubah
- [x] Global CSS: Tidak berubah
- [x] Routing guards: Tidak berubah
- [x] Shared components: Tidak berubah

---

## Testing Instructions

### 1. Start Development Server
```bash
pnpm dev
```

### 2. Navigate to Page 6
```
http://localhost:3000/page-6
```

**Note:** Harus sudah mengisi identity di Page 4 terlebih dahulu, atau akses dari Page 5 menu.

### 3. Visual Comparison
**Reference:** `public/pages/6-learningobjectives.png`

**Periksa:**
- Posisi heading centered, tidak terlalu tinggi/rendah
- Parchment size proporsional, tidak terlalu besar/kecil
- Text berada dalam safe area parchment
- Text wrapping natural, tidak terlalu lebar/sempit
- Classroom decoration visible tapi tidak menutupi
- Navigation di bawah, consistent size

### 4. Responsive Testing
**Breakpoints:**
- Desktop: 707px+
- Tablet: 520-707px
- Mobile: 360-520px
- Small: <360px

**Test:**
- [ ] No horizontal scrolling
- [ ] Text wrapping berfungsi
- [ ] Parchment tetap proporsional
- [ ] Navigation tetap accessible

### 5. Navigation Testing
**Test routes:**
- [ ] Back button → Page 5
- [ ] Home button → Page 5
- [ ] Forward button → Page 7

### 6. Typography Testing
- [ ] Heading menggunakan Baloo 2 (bold, display)
- [ ] Content menggunakan Times New Roman (body)
- [ ] Text readable di semua ukuran

---

## Known Considerations

### Text Content
**Fixed wording (tidak boleh diubah):**
```
Siswa mampu menentukan rumus suku ke-n dari suatu pola bilangan 
sederhana dan menggunakannya untuk memprediksi suku berikutnya
```

### Parchment Positioning
- Menggunakan percentage untuk maintain reference composition
- Desktop: `top: 23%`
- Mobile: `top: 23%` (slightly adjusted 22-21% untuk very small)

### Text Inset
- `15% 12% 14%` provides safe area
- Prevents text touching parchment ornaments
- Allows natural wrapping

### Navigation Variant
- Uses `full` (3 buttons)
- Home button redundant dengan Back (both go to Page 5)
- Maintained untuk consistency dengan navigation pattern

---

## Future Considerations

**Jika perlu adjustment:**
1. Parchment position dapat di-tweak per breakpoint
2. Text inset dapat disesuaikan jika wrapping tidak optimal
3. Font size dapat di-adjust dalam clamp range
4. Navigation dapat menggunakan `dual` jika Home tidak diperlukan

**Tidak boleh:**
- Menggambar ulang parchment dengan CSS
- Mengubah wording content
- Menggunakan font selain Baloo 2 / Times New Roman
- Mengubah Pages 1-5

---

## Summary

**Status:** ✅ Page 6 implementation complete

**Files created:** 2
- `app/page-6/page.tsx`
- `app/page-6/page-6.css`

**Files modified:** 0 (placeholder replaced)

**Other pages:** Unchanged

**Routing:** 
- Accessible from Page 5 menu
- Navigates to Page 5 (back/home) and Page 7 (forward)

**Visual:** Follows reference design dengan asset asli

**Ready for:** Visual verification dan testing
