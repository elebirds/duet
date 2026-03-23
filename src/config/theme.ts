import type { ExpressiveCodeConfig, ThemeColorConfig } from "../types/config";

export const themeColorConfig: ThemeColorConfig = {
	hue: 250,
	fixed: false,
};

export const fontThemeConfig = {
	sans: '"Roboto", "Noto Sans", "Helvetica Neue", Arial, sans-serif',
	mono: '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

export const portalSurfaceConfig = {
	pageGradientLight:
		"radial-gradient(circle at 14% 16%, oklch(0.985 0.035 var(--hue)) 0, transparent 32%), radial-gradient(circle at 84% 14%, oklch(0.94 0.05 40) 0, transparent 24%), linear-gradient(180deg, oklch(0.97 0.01 var(--hue)) 0%, transparent 42%)",
	pageGradientDark:
		"radial-gradient(circle at 14% 16%, oklch(0.27 0.045 var(--hue)) 0, transparent 28%), radial-gradient(circle at 84% 14%, oklch(0.22 0.04 40) 0, transparent 22%), linear-gradient(180deg, oklch(0.19 0.018 var(--hue)) 0%, transparent 42%)",
	gridOpacityLight: 0.35,
	gridOpacityDark: 0.18,
	panelShadowLight: "0 24px 64px rgba(15, 23, 42, 0.06)",
	panelShadowDark: "0 24px 64px rgba(2, 6, 23, 0.38)",
} as const;

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
};
