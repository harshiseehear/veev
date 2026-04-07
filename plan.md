# Implementation Plan — new_doc.md → App.jsx

Reference spec: `src/new_doc.md`

---

## 1. Update Consumer-Facing Copy (Language Shift)

The new spec uses direct-to-consumer language instead of B2B/retailer language.

| Location | Current | New |
|----------|---------|-----|
| Screen 1 heading | "Find the VEEV vape and flavour for your adult customers!" | "What's the best VEEV vape and flavour for you?" |
| Screen 1 CTA | "Start" | "Let's find out!" |
| Q1 title | "What do your adult customers look for in a vape?" | "What do you look for in a vape?" |
| Q2 title | "What're the main pain points with their vape?" | "What're your main pain points with your current vape?" |
| Q2 subtitle | — | Add subtitle: "What don't you love about the vape you're using now?" |
| Q3 title | "What appeals most to your adult customers?" | "What appeals to you the most?" |
| Q4 title | "Which flavour mood do they gravitate towards?" | "What's your flavour mood?" |

---

## 2. Add Option E to Q1

Q1 currently has 4 options (A–D). Add a fifth:

```
E) Easy pod swaps
```

This also changes the maxSelect logic — users still pick 2, but from 5 options instead of 4. The combination space grows from 6 to 10 possible pairs.

---

## 3. Update Device Mapping Logic (`checkAnswerCombination`)

**Current logic:**
- AB, BC, AC → VEEV NOW 18mL
- AD, BD, CD → VEEV ONE

**New logic (from new_doc.md):**
- AC, CD → VEEV NOW ULTRA
- All other combos → VEEV ONE

With 5 options (A–E), the possible pairs are: AB, AC, AD, AE, BC, BD, BE, CD, CE, DE.

Only **AC** and **CD** map to **VEEV NOW ULTRA**. The remaining 8 combos (AB, AD, AE, BC, BD, BE, CE, DE) map to **VEEV ONE**.

---

## 4. Rename Device: "VEEV NOW 18mL" → "VEEV NOW ULTRA"

Update everywhere the old device name appears:
- `RECOMMENDATIONS` object keys
- `checkAnswerCombination` return value
- `FALLBACK_RECOMMENDATION` constant
- Result display in JSX
- Any Google Sheets logging references

---

## 5. Update Q3 Options (Flavour Category)

| Option | Current | New |
|--------|---------|-----|
| A | Bold and fruity | Bold and Fruity |
| B | Crisp and fresh | Crisp and Fresh |
| C | Classic and toasty | **Classic and Rich** |
| D | Berrylicious | **Roasted and Creamy** |

---

## 6. Update Q4 Options (Flavour Mood)

| Option | Current | New |
|--------|---------|-----|
| A | Cool and smooth | Cool and Smooth |
| B | Light and refreshing | Light and Refreshing |
| C | Warm and familiar | Warm and Familiar |
| D | Bright and punchy | **Strong and Punchy** |

---

## 7. Rewrite the RECOMMENDATIONS Matrix

This is the biggest change. The entire flavour set is different.

### VEEV NOW ULTRA Recommendations

| Q3 | Q4 | Flavours |
|----|-----|----------|
| A | A or B | Classic Mint |
| A | C | Gold Tobacco, Auburn Tobacco |
| A | D | Accents Rich Tobacco |
| B | A or B | Classic Mint |
| B | C | Classic Mint, Gold Tobacco, Auburn Tobacco |
| B | D | Classic Mint, Accents Rich Tobacco |
| C | A | Classic Mint, xc Accents Rich Tobacco |
| C | B | Classic Mint, Accents Rich Tobacco |
| C | C | Gold Tobacco, Auburn Tobacco, Accents Rich Tobacco |
| C | D | Accents Rich Tobacco |
| D | A | Classic Mint, Gold Tobacco, Auburn Tobacco |
| D | B | Classic Mint, Gold Tobacco, Auburn Tobacco |
| D | C | Gold Tobacco, Auburn Tobacco |
| D | D | Gold Tobacco, Auburn Tobacco, Accents Rich Tobacco |

### VEEV ONE Recommendations

| Q3 | Q4 | Flavours |
|----|-----|----------|
| A | A | Watermelon, Mango, Blue Mint |
| A | B | Watermelon, Mango, Strawberry |
| A | C | Watermelon, Mango, Classic Tobacco |
| A | D | Watermelon, Mango, Blue Raspberry |
| B | A | Blue Mint, Spearmint, Ice Mint |
| B | B | Blue Mint, Spearmint, Strawberry |
| B | C | Blue Mint, Spearmint, Classic Tobacco |
| B | D | Blue Mint, Spearmint, Blue Raspberry |
| C | A | Classic Tobacco, Blue Mint, Spearmint |
| C | B | Classic Tobacco, Strawberry, Watermelon |
| C | C | Classic Tobacco, Toasted Tobacco, Bright Tobacco |
| C | D | Classic Tobacco, Blue Raspberry, Mango |
| D | A | Mild Tobacco, Blue Mint, Spearmint |
| D | B | Mild Tobacco, Strawberry, Classic Mint |
| D | C | Classic Tobacco, Mild Tobacco, Bright Tobacco |
| D | D | Toasted Tobacco, Classic Tobacco, Blue Raspberry |

---

## 8. Clarify Typos / Ambiguities in new_doc.md Before Implementing

These should be confirmed before coding:

1. ~~**"xc Accents Rich Tobacco"** (NOW ULTRA, Q3=C, Q4=A)~~ — **Confirmed: keep as-is.** Use "xc Accents Rich Tobacco".
2. ~~**Q3=A, Q4=A/B for NOW ULTRA prefix**~~ — **Confirmed: all NOW ULTRA flavours get the "VEEV NOW ULTRA" prefix.**
3. ~~**"V1" vs "VEEV ONE"**~~ — **Confirmed: use "VEEV ONE" everywhere (not "V1").**

---

## 9. Update `flow.md` Documentation

After the code changes, update `flow.md` to match the new spec:
- Device names
- Option lists
- Mapping logic
- Recommendation tables
- Consumer language

---

## 10. Update FALLBACK_RECOMMENDATION

Change from:
```
'VEEV NOW 18 mL - Watermelon, Grape, Blue Mint'
```
To a sensible default from the new matrix, e.g.:
```
'VEEV NOW ULTRA Classic Mint'
```

---

## Execution Order

1. ~~Confirm typos/ambiguities (step 8) with stakeholder~~ ✅ Done
2. Update Q1 options — add option E (step 2)
3. Rewrite `checkAnswerCombination` (step 3)
4. Rename device strings (step 4)
5. Update Q3 and Q4 option labels (steps 5–6)
6. Rewrite `RECOMMENDATIONS` matrix (step 7)
7. Update consumer-facing copy (step 1)
8. Update fallback recommendation (step 10)
9. Update `flow.md` (step 9)
10. Test all 20 combinations (2 devices × 4 Q3 × 4 Q4 + edge cases with 5th option)
