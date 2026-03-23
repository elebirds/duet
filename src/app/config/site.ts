import { licenseConfig } from "../../config/license";
import { navBarConfig } from "../../config/navigation";
import { profileConfig } from "../../config/profile";
import { siteConfig } from "../../config/site";
import { expressiveCodeConfig, themeColorConfig } from "../../config/theme";
import {
	getSiteEntryOverrides,
	mergeSiteConfig,
} from "../../domains/site/content/query";
import type {
	HomeContentConfig,
	ProfileConfig,
	SiteThemeConfig,
} from "../../types/config";
import { loadDemoSiteEntries } from "../content/loaders/demo-site-loader";

const defaultHomeContent: HomeContentConfig = {
	headline: siteConfig.title,
	intro: siteConfig.subtitle,
	featuredRoutes: [],
};

export function getSiteConfig() {
	return siteConfig;
}

export function getNavigationConfig() {
	return navBarConfig;
}

export function getLicenseConfig() {
	return licenseConfig;
}

export function getThemeConfig(): SiteThemeConfig {
	return {
		themeColor: themeColorConfig,
		expressiveCode: expressiveCodeConfig,
	};
}

export async function getHomeContentConfig(): Promise<HomeContentConfig> {
	const entries = await loadDemoSiteEntries();
	const overrides = getSiteEntryOverrides(entries, "home");

	return mergeSiteConfig(defaultHomeContent, overrides);
}

export async function getProfileContentConfig(): Promise<ProfileConfig> {
	const entries = await loadDemoSiteEntries();
	const overrides = getSiteEntryOverrides(entries, "profile");

	return mergeSiteConfig(profileConfig, overrides);
}
