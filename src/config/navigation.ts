import { LinkPreset, type NavBarConfig } from "../types/config";

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		{
			name: "Moments",
			url: "/moments/",
		},
		LinkPreset.About,
		{
			name: "GitHub",
			url: "https://github.com/elebirds/duet",
			external: true,
		},
	],
};
