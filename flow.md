# VEEV Flavor Recommendation Flow

## Overview
An interactive web app that recommends VEEV device and flavor combinations based on customer preferences. The recommendation engine uses a multi-step questionnaire to determine the optimal product match.

---

## Screen Flow

### Screen 1: Welcome Screen
**Content:**
```
Find the VEEV vape and flavour for your adult customers!
```
**Action:** Start button → Navigate to Screen 2

---

### Screen 2: Question 1 - Device Selection (CRITICAL)
**Question:** "What do your adult customers look for in a vape?"

**Format:** Pick 2 options

**Options:**
- A: Easy to use
- B: Fast charging
- C: High puff count
- D: Aluminum body

**Decision Logic:**
| Answer Combination | Recommended Device |
|-------------------|-------------------|
| AB, BC, AC | VEEV NOW 18mL |
| AD, BD, CD | VEEV ONE |

**Note:** The device selected here determines the flavor options in Q3 and final recommendations.

---

### Screen 3: Question 2 - Pain Points (Non-Critical)
**Question:** "What are adult customers' main pain points with their vape?"

**Format:** Pick 2 options

**Options:**
- Leaky pods
- Low puff count
- Takes forever to charge
- Too bulky

**Impact:** None - This question does not affect the outcome, used for data collection only.

---

### Screen 4: Question 3 - Flavor Category (CRITICAL)
**Question:** "What appeals to your adult customers most?"

**Format:** Pick 1 option

**Options:**
- A: Bold and fruity
- B: Crisp and fresh
- C: Classic and toasty
- D: Berrylicious

**Impact:** Determines the primary flavor category for final recommendation.

#### Available Flavors by Device:

**If Device = VEEV NOW 18mL:**
- A (Bold and fruity) → Watermelon & Grape
- B (Crisp and fresh) → Spearmint and Blue mint
- C (Classic and toasty) → Classic Tobacco
- D (Berrylicious) → Blueberry

**If Device = VEEV ONE:**
- A (Bold and fruity) → Watermelon & Mango
- B (Crisp and fresh) → Spearmint and Blue mint
- C (Classic and toasty) → Classic Tobacco
- D (Berrylicious) → Blueberry and Blue Raspberry

---

### Screen 5: Question 4 - Flavor Mood (CRITICAL)
**Question:** "Which flavour mood do your customers gravitate toward?"

**Format:** Pick 1 option

**Options:**
- A: Cool and smooth
- B: Light and refreshing
- C: Warm and familiar
- D: Bright and punchy

**Impact:** Modifies the flavor package by adding complementary flavors.

---

## Final Recommendation Logic

### Recommendation Matrix

The final recommendation is determined by the combination of:
1. **Device** (from Q1)
2. **Flavor Category** (from Q3)
3. **Flavor Mood** (from Q4)

---

### VEEV NOW 18mL Recommendations

#### Q3 = A (Bold and Fruity)
| Q4 Option | Recommendation |
|-----------|----------------|
| A (Cool and smooth) | 18 mL Watermelon, Grape, Blue Mint |
| B (Light and refreshing) | 18 mL Watermelon, Grape |
| C (Warm and familiar) | 18 mL Watermelon, Grape, Classic Tobacco |
| D (Bright and punchy) | 18 mL Watermelon, Grape, Blueberry |

#### Q3 = B (Crisp and Fresh)
| Q4 Option | Recommendation |
|-----------|----------------|
| A (Cool and smooth) | 18 mL Spearmint, Blue Mint |
| B (Light and refreshing) | 18 mL Spearmint, Blue Mint, Watermelon |
| C (Warm and familiar) | 18 mL Spearmint, Blue Mint, Classic Tobacco |
| D (Bright and punchy) | 18 mL Spearmint, Blue Mint, Blueberry |

#### Q3 = C (Classic and Toasty)
| Q4 Option | Recommendation |
|-----------|----------------|
| A (Cool and smooth) | 18 mL Classic Tobacco, Blue Mint, Spearmint |
| B (Light and refreshing) | 18 mL Classic Tobacco, Watermelon, Grape |
| C (Warm and familiar) | 18 mL Classic Tobacco |
| D (Bright and punchy) | 18 mL Classic Tobacco, Blueberry |

#### Q3 = D (Berrylicious)
| Q4 Option | Recommendation |
|-----------|----------------|
| A (Cool and smooth) | 18 mL Blueberry, Blue mint, Spearmint |
| B (Light and refreshing) | 18 mL Blueberry, Watermelon, Grape |
| C (Warm and familiar) | 18 mL Blueberry, Classic Tobacco |
| D (Bright and punchy) | 18 mL Blueberry |

---

### VEEV ONE Recommendations

#### Q3 = A (Bold and Fruity)
| Q4 Option | Recommendation |
|-----------|----------------|
| A (Cool and smooth) | V1 Watermelon, Mango, Blue Mint |
| B (Light and refreshing) | V1 Watermelon, Mango |
| C (Warm and familiar) | V1 Watermelon, Mango, Classic Tobacco |
| D (Bright and punchy) | V1 Watermelon, Mango, Blue Raspberry |

#### Q3 = B (Crisp and Fresh)
| Q4 Option | Recommendation |
|-----------|----------------|
| A (Cool and smooth) | V1 Blue Mint, Spearmint |
| B (Light and refreshing) | V1 Blue Mint, Spearmint, Mango |
| C (Warm and familiar) | V1 Blue Mint, Spearmint, Classic Tobacco |
| D (Bright and punchy) | V1 Blue Mint, Spearmint, Blueberry |

#### Q3 = C (Classic and Toasty)
| Q4 Option | Recommendation |
|-----------|----------------|
| A (Cool and smooth) | V1 Classic Tobacco, Blue Mint, Spearmint |
| B (Light and refreshing) | V1 Classic Tobacco, Watermelon, Mango |
| C (Warm and familiar) | V1 Classic Tobacco |
| D (Bright and punchy) | V1 Classic Tobacco, Blueberry, Blue Raspberry |

#### Q3 = D (Berrylicious)
| Q4 Option | Recommendation |
|-----------|----------------|
| A (Cool and smooth) | V1 Blueberry, Blue Raspberry, Spearmint |
| B (Light and refreshing) | V1 Blueberry, Blue Raspberry, Watermelon |
| C (Warm and familiar) | V1 Blueberry, Blue Raspberry, Classic Tobacco |
| D (Bright and punchy) | V1 Blueberry, Blue Raspberry |

---

## Implementation Notes

### State Management
The app needs to track:
```javascript
{
  q1: [], // Array of 2 selections (A, B, C, D)
  q2: [], // Array of 2 selections (not used in logic)
  q3: "", // Single selection (A, B, C, D)
  q4: "", // Single selection (A, B, C, D)
  device: "", // Derived from q1: "VEEV NOW 18mL" or "VEEV ONE"
  recommendation: "" // Final flavor package
}
```

### Device Determination Function
```
checkAnswerCombination(q1Array):
  combinations = [q1[0] + q1[1], q1[1] + q1[0]] // e.g., ["AB", "BA"]
  
  if "AB" in combinations or "BC" in combinations or "AC" in combinations:
    return "VEEV NOW 18mL"
  
  if "AD" in combinations or "BD" in combinations or "CD" in combinations:
    return "VEEV ONE"
```

### Recommendation Lookup
The final recommendation is a lookup using the key: `${device}_${q3}_${q4}`

Example: `VEEV NOW 18mL_A_B` → "18 mL Watermelon, Grape"

---

## Screen 6: Final Recommendation Display

**Format:**
```
Suggested Product and Flavour Package:

[Device Name]
[Flavor Package]

[Call to Action Button]
```

**Example:**
```
Suggested Product and Flavour Package:

VEEV NOW 18mL
Watermelon, Grape, Blue Mint

[Shop Now] [Start Over]
```
