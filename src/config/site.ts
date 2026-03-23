import type { SiteConfig } from "../types/config";
import { themeColorConfig } from "./theme";

export const siteConfig: SiteConfig = {
	title: "Duet",
	subtitle: "Private-first personal portal",
	lang: "en",
	themeColor: themeColorConfig,
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png",
		position: "center",
		credit: {
			enable: false,
			text: "",
			url: "",
		},
	},
	toc: {
		enable: true,
		depth: 2,
	},
	favicon: [],
};
