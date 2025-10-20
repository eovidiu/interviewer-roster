import { describe, it, expect } from 'vitest';

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const R =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const G =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const B =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('Issue #32: Color contrast for badge variants', () => {
  // Tailwind CSS color values
  const colors = {
    'green-50': '#f0fdf4',
    'green-100': '#dcfce7',
    'green-200': '#bbf7d0',
    'green-800': '#166534',
    'green-900': '#14532d',
    'green-950': '#052e16',
  };

  it('should have sufficient contrast for Active badge in light mode (current)', () => {
    // Current implementation: text-green-800 on bg-green-100
    const textColor = colors['green-800']; // #166534
    const bgColor = colors['green-100']; // #dcfce7

    const contrastRatio = getContrastRatio(textColor, bgColor);

    // WCAG AA requires 4.5:1 for normal text
    // This test will FAIL if contrast is insufficient
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have sufficient contrast for Active badge in dark mode (current)', () => {
    // Current implementation: text-green-200 on bg-green-900
    const textColor = colors['green-200']; // #bbf7d0
    const bgColor = colors['green-900']; // #14532d

    const contrastRatio = getContrastRatio(textColor, bgColor);

    // WCAG AA requires 4.5:1 for normal text
    // This test will FAIL if contrast is insufficient
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should meet WCAG AAA standard (7:1) for better accessibility', () => {
    // Recommended improvement: use higher contrast colors
    // Light mode: text-green-900 on bg-green-50
    const lightTextColor = colors['green-950'];
    const lightBgColor = colors['green-50'];

    const lightContrast = getContrastRatio(lightTextColor, lightBgColor);

    // Dark mode: text-green-100 on bg-green-900
    const darkTextColor = colors['green-100'];
    const darkBgColor = colors['green-900'];

    const darkContrast = getContrastRatio(darkTextColor, darkBgColor);

    // Both should meet AAA standard for enhanced accessibility
    expect(lightContrast).toBeGreaterThanOrEqual(7.0);
    expect(darkContrast).toBeGreaterThanOrEqual(7.0);
  });

  it('should have proper color values defined', () => {
    // Verify all colors are valid hex codes
    Object.entries(colors).forEach(([name, hex]) => {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('Color contrast utility functions', () => {
  it('should correctly convert hex to RGB', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('should calculate correct luminance for pure colors', () => {
    // White should have luminance of 1
    const whiteLuminance = getLuminance(255, 255, 255);
    expect(whiteLuminance).toBeCloseTo(1, 2);

    // Black should have luminance of 0
    const blackLuminance = getLuminance(0, 0, 0);
    expect(blackLuminance).toBe(0);
  });

  it('should calculate correct contrast ratios for known pairs', () => {
    // Black on white should be 21:1 (maximum possible)
    const maxContrast = getContrastRatio('#000000', '#ffffff');
    expect(maxContrast).toBeCloseTo(21, 1);

    // Same color should be 1:1 (minimum possible)
    const minContrast = getContrastRatio('#ffffff', '#ffffff');
    expect(minContrast).toBeCloseTo(1, 1);
  });
});
