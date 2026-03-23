export const supportedLayoutVariants = ["list", "grid", "timeline"] as const;

export type LayoutVariant = (typeof supportedLayoutVariants)[number];

export const layoutVariantClasses: Record<LayoutVariant, string> = {
	list: "flex flex-col gap-6",
	grid: "grid gap-6 md:grid-cols-2",
	timeline: "flex flex-col gap-6",
};

export function resolveLayoutVariant(value: string): LayoutVariant {
	return supportedLayoutVariants.includes(value as LayoutVariant)
		? (value as LayoutVariant)
		: "list";
}
