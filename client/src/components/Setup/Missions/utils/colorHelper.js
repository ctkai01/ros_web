// Color helper for mission action levels

const DEFAULT_ICON_BASE_HEX = '#37a1e7';
const DEFAULT_PANEL_BASE_HEX = '#5cb6f2';

const GOLDEN_RATIO = 0.61803398875; // for even hue distribution

function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function hexToHsl(hex) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const num = parseInt(full, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, l };
}

function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + hue / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function rotateHueByLevel(baseHue, level) {
  if (level <= 0) return baseHue;
  return baseHue + level * GOLDEN_RATIO * 360;
}

export function getIconColorForLevel(level, baseHex = DEFAULT_ICON_BASE_HEX, options = {}) {
  if (level === 0) return baseHex;

  const { h, s, l } = hexToHsl(baseHex);
  const hue = rotateHueByLevel(h, level);

  const saturationBoost = options.iconSaturationBoost ?? 0.06;
  const darkenAmount = options.iconDarken ?? 0.10;

  const sOut = clamp01(s + saturationBoost);
  const lOut = clamp01(l - darkenAmount);

  return hslToHex(hue, sOut, lOut);
}

export function getPanelColorForLevel(level, baseHex = DEFAULT_PANEL_BASE_HEX, options = {}) {
  if (level === 0) return baseHex;

  const { h, s, l } = hexToHsl(baseHex);
  const hue = rotateHueByLevel(h, level);

  // Make panel visibly lighter and less saturated by default
  const desaturateAmount = options.panelDesaturate ?? 0.14;
  const lightenAmount = options.panelLighten ?? 0.20;

  const sOut = clamp01(s - desaturateAmount);
  const lOut = clamp01(l + lightenAmount);

  return hslToHex(hue, sOut, lOut);
}

export function getColorsForLevel(level, config = {}) {
  const iconBase = config.iconBase ?? DEFAULT_ICON_BASE_HEX;
  const panelBase = config.panelBase ?? DEFAULT_PANEL_BASE_HEX;
  const options = config.options ?? {};

  return {
    icon: getIconColorForLevel(level, iconBase, options),
    panel: getPanelColorForLevel(level, panelBase, options)
  };
}

export const ColorHelper = {
  getIconColorForLevel,
  getPanelColorForLevel,
  getColorsForLevel
};