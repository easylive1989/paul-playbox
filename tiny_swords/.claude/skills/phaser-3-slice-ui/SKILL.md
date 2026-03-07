---
name: phaser-3-slice-ui
description: Use when working with 3-slice or 9-slice UI sprite assets in Phaser 3, especially when scaling multi-segment images like progress bars, buttons, or panels. Symptoms include distorted end caps, missing middle sections, or setCrop not rendering correctly with setDisplaySize.
---

# Phaser 3 — 3-Slice UI Sprite Technique

## Overview

Many game UI assets (bars, buttons, banners) are delivered as **3-slice images**: left cap + stretchable middle + right cap. The correct way to use them in Phaser 3 depends on the target display size relative to the source cap sizes.

## When to Use

- UI asset filename contains `3Slides`, `BigBar`, `SmallBar`, or similar
- Image visually has distinct end caps and a repeatable middle section
- You need to render the asset at an arbitrary width without distorting the end caps

## Core Problem: setCrop + setDisplaySize Conflict

`setDisplaySize(w, h)` internally calculates scale from the **full texture** dimensions:

```javascript
// Source: 320×64 image
image.setCrop(0, 0, 64, 64);       // Crop to left 64px
image.setDisplaySize(16, 22);       // Scale = 16/320 = 0.05
// Result: cropped region displays at 64 * 0.05 = 3.2px — NOT 16px!
```

`setDisplaySize` divides by the **full frame width** (320), not the cropped width (64). The crop is applied after scaling, so cropped regions render much smaller than expected.

## Solution: Load as Spritesheet

Split the source image into individual frames by loading it as a spritesheet. Each frame becomes an independent 64×64 texture, so `setDisplaySize` scales correctly.

### Step 1: Asset Manifest

```javascript
// ❌ BAD: Single image — setCrop won't work with setDisplaySize
{ key: 'ui_bigbar_base', path: 'BigBar_Base.png' }

// ✅ GOOD: Spritesheet — each frame is independently scalable
// BigBar_Base.png is 320×64 → 5 frames of 64×64
{ key: 'ui_bigbar_base', path: 'BigBar_Base.png', frameWidth: 64, frameHeight: 64 }
```

### Step 2: Compose with Frame Indices

```javascript
// For a 320×64 image with 5 frames:
// Frame 0 = left cap, Frame 2 = middle wood, Frame 4 = right cap
const capW = 16;
const midW = 96;
const barH = 22;
const barLeft = centerX - (capW * 2 + midW) / 2;

// Left cap — frame 0, scaled to 16×22
scene.add.image(barLeft, y, 'ui_bigbar_base', 0)
    .setOrigin(0, 0.5).setDisplaySize(capW, barH);

// Middle — frame 2, stretched to fill
scene.add.image(barLeft + capW, y, 'ui_bigbar_base', 2)
    .setOrigin(0, 0.5).setDisplaySize(midW, barH);

// Right cap — frame 4, scaled to 16×22
scene.add.image(barLeft + capW + midW, y, 'ui_bigbar_base', 4)
    .setOrigin(0, 0.5).setDisplaySize(capW, barH);
```

## Alternative: NineSlice (Large UI Only)

Phaser 3.60+ has built-in `NineSlice`, but caps render at **source pixel size** (not scaled):

```javascript
// leftWidth=64, rightWidth=64 → caps take 128px on screen
// If display width is also 128px, middle gets 0px!
scene.add.nineslice(x, y, 'texture', null, 128, 22, 64, 64, 0, 0);
```

| Approach | When to Use |
|----------|------------|
| **Spritesheet + frame indices** | Small UI (target width < 2× source cap size) |
| **NineSlice** | Large panels (target width >> source cap sizes) |

## Quick Reference

| Source Layout | frameWidth | Left Cap | Middle | Right Cap |
|--------------|-----------|----------|--------|-----------|
| 192×64 (3 slots) | 64 | Frame 0 | Frame 1 | Frame 2 |
| 320×64 (5 slots) | 64 | Frame 0 | Frame 2 | Frame 4 |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `setCrop` + `setDisplaySize` on same image | Load as spritesheet, use frame indices |
| NineSlice with small target width | Caps eat all space; use spritesheet approach |
| Scaling entire NineSlice with `setScale` | Defeats purpose; use `setSize()` or spritesheet |
| Forgetting `setOrigin(0, 0.5)` on pieces | Pieces overlap; set origin for left-to-right layout |
