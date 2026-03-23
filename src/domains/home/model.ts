export function buildHomeRouteCards<T extends { enabled?: boolean }>(
	items: T[],
) {
	return items.filter((item) => item.enabled !== false);
}
