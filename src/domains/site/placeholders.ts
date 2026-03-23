import type { PlaceholderRouteConfig } from "../../types/config";

export const placeholderRouteMeta: Record<
	"cv" | "portfolio",
	PlaceholderRouteConfig
> = {
	cv: {
		title: "CV",
		href: "/cv/",
		description: "Interactive CV is not available yet.",
		enabled: false,
	},
	portfolio: {
		title: "Portfolio",
		href: "/portfolio/",
		description: "Portfolio is not available yet.",
		enabled: false,
	},
};
