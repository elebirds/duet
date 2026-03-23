import type { ProfileConfig } from "../types/config";

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar.png",
	name: "Lorem Ipsum",
	bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	links: [
		{
			name: "Twitter",
			icon: "fa6-brands:twitter",
			url: "https://twitter.com",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://store.steampowered.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/elebirds/duet",
		},
	],
};
