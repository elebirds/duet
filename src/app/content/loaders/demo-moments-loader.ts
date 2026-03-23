export async function loadDemoMomentsEntries() {
	return [
		{
			id: "public-welcome",
			published: new Date("2026-03-23T08:00:00.000Z"),
			visibility: "public" as const,
			lang: "en",
			summary: "Public demo moment for the upcoming Moments timeline.",
		},
		{
			id: "private-welcome",
			published: new Date("2026-03-23T08:30:00.000Z"),
			visibility: "private" as const,
			lang: "en",
			summary: "Private demo moment reserved for authenticated rendering later.",
		},
	];
}
