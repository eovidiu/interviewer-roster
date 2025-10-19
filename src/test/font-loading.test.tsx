import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Issue #31: Google Fonts loading optimization', () => {
  it('should NOT use CSS @import for fonts in index.css', () => {
    // Read the index.css file
    const indexCssPath = join(__dirname, '../index.css');
    const indexCssContent = readFileSync(indexCssPath, 'utf-8');

    // This test will FAIL initially because index.css contains @import
    // After fix, index.css should NOT contain Google Fonts @import
    expect(indexCssContent).not.toContain('@import');
    expect(indexCssContent).not.toContain('fonts.googleapis.com');
  });

  it('should have preconnect links in index.html', () => {
    // Read the index.html file
    const indexHtmlPath = join(__dirname, '../../index.html');
    const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

    // This test will FAIL initially because index.html doesn't have preconnect
    // After fix, should have both preconnect links
    expect(indexHtmlContent).toContain('rel="preconnect"');
    expect(indexHtmlContent).toContain('https://fonts.googleapis.com');
    expect(indexHtmlContent).toContain('https://fonts.gstatic.com');
  });

  it('should load font stylesheet in index.html', () => {
    // Read the index.html file
    const indexHtmlPath = join(__dirname, '../../index.html');
    const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

    // This test will FAIL initially because index.html doesn't have font link
    // After fix, should have stylesheet link
    expect(indexHtmlContent).toContain('rel="stylesheet"');
    expect(indexHtmlContent).toContain('fonts.googleapis.com/css2');
    expect(indexHtmlContent).toContain('family=Inter');
  });

  it('should only load necessary font weights (400, 500, 600, 700)', () => {
    // Read the index.html file
    const indexHtmlPath = join(__dirname, '../../index.html');
    const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

    // This test will FAIL initially
    // After fix, should only load 4 weights instead of 9
    expect(indexHtmlContent).toContain('wght@400;500;600;700');

    // Should NOT load all 9 weights
    expect(indexHtmlContent).not.toContain('wght@100;200;300;400;500;600;700;800;900');
  });

  it('should use font-display=swap for better performance', () => {
    // Read the index.html file
    const indexHtmlPath = join(__dirname, '../../index.html');
    const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

    // This test will FAIL initially
    // After fix, font URL should include display=swap
    expect(indexHtmlContent).toContain('display=swap');
  });

  it('should have proper font fallbacks in index.css', () => {
    // Read the index.css file
    const indexCssPath = join(__dirname, '../index.css');
    const indexCssContent = readFileSync(indexCssPath, 'utf-8');

    // After fix, should have system font fallbacks
    expect(indexCssContent).toContain('Inter');
    expect(indexCssContent).toContain('sans-serif');
  });
});
