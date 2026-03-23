export async function loadDemoSiteEntries() {
	return [
		{
			id: "home",
			kind: "home" as const,
			headline: "Duet",
			intro:
				"A private-first personal portal built from public code and private memories.",
			featuredRoutes: [
				{
					title: "Memories Off",
					href: "/1/",
					description: "Long-form writing and research notes.",
				},
				{
					title: "Moments",
					href: "/moments/",
					description: "Short status updates with future visibility controls.",
				},
				{
					title: "Portfolio",
					href: "/portfolio/",
					description:
						"Selected projects, active learning trails, and system notes.",
				},
			],
		},
		{
			id: "profile",
			kind: "profile" as const,
			name: "HHM",
			bio: "Builder of Duet and curator of private digital memory.",
			avatar: "assets/images/demo-avatar.png",
			links: [
				{
					name: "GitHub",
					url: "https://github.com/elebirds/duet",
					icon: "fa6-brands:github",
				},
			],
		},
	];
}
