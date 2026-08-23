---
name: Coastal Haven
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#43474e'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#73777f'
  outline-variant: '#c3c6cf'
  surface-tint: '#416085'
  primary: '#103457'
  on-primary: '#ffffff'
  primary-container: '#2b4b6f'
  on-primary-container: '#9cbbe5'
  inverse-primary: '#a9c9f3'
  secondary: '#3f6371'
  on-secondary: '#ffffff'
  secondary-container: '#c2e8f8'
  on-secondary-container: '#456977'
  tertiary: '#373229'
  on-tertiary: '#ffffff'
  tertiary-container: '#4e483e'
  on-tertiary-container: '#c0b7ab'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a9c9f3'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#28486c'
  secondary-fixed: '#c2e8f8'
  secondary-fixed-dim: '#a7ccdc'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#274c58'
  tertiary-fixed: '#ebe1d4'
  tertiary-fixed-dim: '#cfc5b9'
  on-tertiary-fixed: '#1f1b13'
  on-tertiary-fixed-variant: '#4c463c'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 16px
  section-gap: 48px
---

## Brand & Style

The brand personality is refined yet relaxed, capturing the essence of a high-end Maine coastal retreat. It aims to evoke feelings of serenity, nostalgia, and effortless organization. The target audience includes vacationing families and seasonal residents who value both the rugged beauty of the coast and the polished amenities of a managed resort community.

The design style is **Modern Coastal**. It leans heavily into minimalism to ensure the UI feels light and airy, while utilizing soft shadows and rounded corners to provide a tactile, welcoming feel. This approach balances the professional requirements of a property management tool with the leisure-focused mindset of a summer vacation.

## Colors

The palette is derived directly from the Maine shoreline. The **Deep Navy** (Primary) provides an authoritative, nautical foundation for headers and primary actions. The **Muted Teal** (Secondary) serves as a calming accompaniment for secondary interactive elements and decorative accents.

A **Sandy Neutral** (#E8DED1) is used for subtle background sections and container fills to add warmth. The interface remains predominantly **Crisp White**, ensuring a high-contrast, clean reading experience. A **Soft Grey** is reserved for metadata and borders to maintain a low-friction visual hierarchy.

## Typography

The system utilizes **Plus Jakarta Sans** for headings to inject a friendly, contemporary, and slightly rounded character that feels approachable. For body text and functional labels, **Manrope** is used to ensure maximum legibility and a professional, balanced tone.

The scale is designed to be "relaxed" with generous line heights to prevent the interface from feeling cramped. Mobile-specific adjustments ensure that large display titles remain readable without overwhelming the smaller screen real estate.

## Layout & Spacing

The layout follows a **fluid grid** model with a maximum content width of 1280px for desktop. It uses a 12-column structure for tablet and desktop, transitioning to a single-column stack on mobile devices.

The spacing rhythm is intentional and generous, favoring whitespace to reinforce the "airy" brand pillar. Margins are wider than standard utility apps (20px on mobile) to create a premium, gallery-like feel for resort imagery and content. Sections are separated by significant vertical gaps to allow the eye to rest between different types of information.

## Elevation & Depth

Hierarchy is established through **tonal layers** and **ambient shadows**. Backgrounds use the Neutral Soft Grey or Sandy Neutral, while primary content containers sit on Crisp White cards.

Shadows are exceptionally soft and diffused (e.g., `box-shadow: 0 10px 30px rgba(43, 75, 111, 0.08)`), using a subtle Navy tint rather than pure black to keep the palette cohesive. This creates a "floating" effect that suggests a light, breezy atmosphere. Interactive elements like buttons and active cards use a slightly more pronounced shadow on hover to indicate tactility.

## Shapes

The design system uses a **Rounded** (Level 2) shape language. This softens the overall aesthetic, making the professional application feel more like a hospitality-first experience. 

Standard components like input fields and buttons use a 0.5rem radius. Feature cards and large containers use the `rounded-xl` (1.5rem) setting to create a distinct, friendly framing for photography. Iconography should follow this rounded theme, avoiding sharp corners or aggressive points.

## Components

### Buttons
Primary buttons are solid Deep Navy with white text, using the standard 0.5rem corner radius. Secondary buttons use a Muted Teal outline or a light Sandy Neutral fill to indicate lower priority.

### Cards
Cards are the primary organizational unit. They must feature a white background, the defined Level 2 roundedness, and a soft navy-tinted ambient shadow. For resort amenities, cards should include a top-weighted image with a subtle gradient overlay for text legibility.

### Inputs & Fields
Input fields use a light grey border and the Sandy Neutral background when inactive. On focus, the border transitions to Muted Teal with a soft glow effect.

### Chips & Badges
Used for tagging events (e.g., "Pool," "Fitness," "Dinner"). These should use the Muted Teal background at 15% opacity with Deep Navy text to maintain high legibility while appearing soft.

### Navigation
The mobile experience should prioritize a clean bottom tab bar with thin-stroke icons. On desktop, a persistent top navigation bar using Deep Navy for the active state ensures the "professional" side of the property management remains accessible.