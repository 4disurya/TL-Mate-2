```markdown
---
design_system:
  colors:
    background:
      gradient_start: "#FFFFFF" # White top
      gradient_end: "#EFF4EC"   # Sage cream bottom
    surface:
      glass_bg: "rgba(255, 255, 255, 0.92)"
      glass_border: "rgba(15, 23, 42, 0.07)"
      glass_nav: "rgba(42, 96, 85, 0.97)" # Dark teal for bottom nav
    text:
      primary: "#0F172A"
      secondary: "#6E7F79" # Sage gray
      accent: "#2A6055"    # Dark teal
    status:
      info_amber: "#EFA93C"    # Primary CTA, active UI
      success_teal: "#2E7D6B"  # Pass scores, chips, done
  typography:
    font_family: "Sans-Serif (Inter/SF Pro Display)"
    scales:
      h1: "28px / Bold"
      h2: "20px / SemiBold"
      body_lg: "16px / Medium"
      body_md: "14px / Regular"
      caption: "12px / Regular"
      value_display: "24px / Bold"
  spacing:
    container_padding: "20px"
    element_gap: "16px"
    section_gap: "28px"
    internal_card_padding: "16px"
  radius:
    card: "24px"
    button_pill: "4px"
    icon_box: "12px"
    avatar: "full"
  shadows:
    glass_glow: "0 4px 24px rgba(15, 23, 42, 0.04)"
    btn_glow: "inset 0 1px 1px rgba(255,255,255,0.3), 0 8px 20px rgba(239, 169, 60, 0.25)"
---

## 🔬 Design Audit
- **Style:** Clean Medical-Lab / Warm Sage-Teal Theme.
- **Mood:** Professional, Clinical, Warm, Trustworthy.
- **Screen Type:** Mobile Dashboard.
- **Visual Hierarchy:** High contrast between dark text (`#0F172A`) and light background. Depth created by subtle shadows and frosted glass elements over a pale sage-cream gradient. Dark teal navigation bar grounds the layout.

## 🎨 Color Palette & Design Tokens
- **Primary Background:** Linear Gradient (180deg) from `#FFFFFF` to `#EFF4EC`.
- **Component Surfaces:** Semi-transparent white (`rgba(255,255,255,0.92)`) with `backdrop-filter: blur(20px)`.
- **Navigation Bar:** Dark Teal (`rgba(42, 96, 85, 0.97)`).
- **Typography:** 
    - Slate-900 (`#0F172A`) for headings and primary data.
    - Sage Gray (`#6E7F79`) for sub-labels and secondary info.
- **Accents:** 
    - Amber (`#EFA93C`) used for primary buttons and active navigation states.
    - Deep Teal (`#2A6055`) used for dark accents, prices, and small active chips.
    - Teal-Green (`#2E7D6B`) used for success states and badges.

## ⚛️ Lab-Tech Component Specification

### Buttons (`.btn-lab`)
- **Shape:** Chamfered corners (cut top-left and bottom-right via `clip-path`).
- **Surface:** Amber gradient (`#F6C567` to `#EBA336`).
- **Typography:** Uppercase, tracking-widest (`0.08em`), pure white.
- **Effects:** Inner white top glow + outer amber drop-shadow glow.

### Molecules
- **Glass Card:** White frosted container with light slate border (`rgba(15,23,42,0.07)`) and very soft shadow.
- **Status Badges:** Red/Amber/Teal text on corresponding pale background (`bg-color/20`).

## 📐 Layout & Viewport Composition
- **Viewport:** 393x852px.
- **Safe Areas:** Clearance for Dynamic Island and Home Indicator.
- **Margins:** 20px side margins (Left/Right).
```