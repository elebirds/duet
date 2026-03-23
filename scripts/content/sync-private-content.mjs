const mode = process.env.DUET_CONTENT_LOCAL_PATH
	? "local"
	: process.env.DUET_CONTENT_REPO && process.env.CONTENT_REPO_TOKEN
		? "token"
		: "demo";

console.log(`[duet] content sync mode: ${mode}`);
