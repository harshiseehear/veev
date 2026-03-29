# VEEV Interactive Decision Tree

## Screen 1 – Start
**Message:**  
Find the VEEV vape and flavour for your adult customers!

---

## Screen 2 – Q1: Device Preference (Pick 2)

**What do your adult customers look for in a vape?**

A. Easy to use  
B. Fast charging  
C. High puff count  
D. Aluminum body  

### Device Decision Logic

- If selection is:
  - AB, BC, AC → **VEEV NOW 18 mL -**
  - AD, BD, CD → **VEEV ONE**

---

## Screen 3 – Q2: Pain Points (Pick 2)

**What are adult customers’ main pain points with their vape?**

- Leaky pods  
- Low puff count  
- Takes forever to charge  
- Too bulky  

**Note:** Does not impact outcome.

---

## Screen 4 – Q3: Flavour Profile Preference (Pick 1)

A. Bold and fruity  
B. Crisp and fresh  
C. Classic and toasty  
D. Berrylicious  

### Base Flavour Mapping by Device

#### If Device = VEEV NOW 18 mL -
- A → Watermelon & Grape  
- B → Spearmint & Blue Mint  
- C → Classic Tobacco  
- D → Blueberry  

#### If Device = VEEV ONE
- A → Watermelon & Mango  
- B → Spearmint & Blue Mint  
- C → Classic Tobacco  
- D → Blueberry & Blue Raspberry  

---

## Screen 5 – Q4: Flavour Mood (Pick 1)

a. Cool and smooth  
b. Light and refreshing  
c. Warm and familiar  
d. Bright and punchy  

---

# Final Outcome Logic (Screen 6)

---

# IF DEVICE = VEEV NOW 18 mL -

## Q3 = Bold and Fruity
- a → VEEV NOW 18 mL - Watermelon, Grape, Blue Mint  
- b → VEEV NOW 18 mL - Watermelon, Grape  
- c → VEEV NOW 18 mL - Watermelon, Grape, Classic Tobacco  
- d → VEEV NOW 18 mL - Watermelon, Grape, Blueberry  

## Q3 = Crisp and Fresh
- a → VEEV NOW 18 mL - Spearmint, Blue Mint  
- b → VEEV NOW 18 mL - Spearmint, Blue Mint, Watermelon  
- c → VEEV NOW 18 mL - Spearmint, Blue Mint, Classic Tobacco  
- d → VEEV NOW 18 mL - Spearmint, Blue Mint, Blueberry  

## Q3 = Classic and Toasty
- a → VEEV NOW 18 mL - Classic Tobacco, Blue Mint, Spearmint  
- b → VEEV NOW 18 mL - Classic Tobacco, Watermelon, Grape  
- c → VEEV NOW 18 mL - Classic Tobacco  
- d → VEEV NOW 18 mL - Classic Tobacco, Blueberry  

## Q3 = Berrylicious
- a → VEEV NOW 18 mL - Blueberry, Blue Mint, Spearmint  
- b → VEEV NOW 18 mL - Blueberry, Watermelon, Grape  
- c → VEEV NOW 18 mL - Blueberry, Classic Tobacco  
- d → VEEV NOW 18 mL - Blueberry  

---

# IF DEVICE = VEEV ONE

## Q3 = Bold and Fruity
- a → VEEV ONE Watermelon, Mango, Blue Mint  
- b → VEEV ONE Watermelon, Mango  
- c → VEEV ONE Watermelon, Mango, Classic Tobacco  
- d → VEEV ONE Watermelon, Mango, Blue Raspberry  

## Q3 = Crisp and Fresh
- a → VEEV ONE Blue Mint, Spearmint  
- b → VEEV ONE Blue Mint, Spearmint, Mango  
- c → VEEV ONE Blue Mint, Spearmint, Classic Tobacco  
- d → VEEV ONE Blue Mint, Spearmint, Blueberry  

## Q3 = Classic and Toasty
- a → VEEV ONE Classic Tobacco, Blue Mint, Spearmint  
- b → VEEV ONE Classic Tobacco, Watermelon, Mango  
- c → VEEV ONE Classic Tobacco  
- d → VEEV ONE Classic Tobacco, Blueberry, Blue Raspberry  

## Q3 = Berrylicious
- a → VEEV ONE Blueberry, Blue Raspberry, Spearmint  
- b → VEEV ONE Blueberry, Blue Raspberry, Watermelon  
- c → VEEV ONE Blueberry, Blue Raspberry, Classic Tobacco  
- d → VEEV ONE Blueberry, Blue Raspberry  
```}