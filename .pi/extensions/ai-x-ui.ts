import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	let firstTurn = true;

	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;

		// Apply ai-x theme
		ctx.ui.setTheme("ai-x");

		// Custom header
		ctx.ui.setHeader((_tui, theme) => ({
			render(_width: number): string[] {
				return [
					"",
					"  " + theme.fg("accent", "◉ ai-x") + theme.fg("muted", " — your AI Twitter scout"),
					"  " + theme.fg("dim", "escape") + theme.fg("muted", " to interrupt · ") +
						theme.fg("dim", "ctrl+c twice") + theme.fg("muted", " to exit · ") +
						theme.fg("dim", "/") + theme.fg("muted", " for commands"),
					"",
				];
			},
			invalidate() {},
		}));

		// Footer status badge
		const t = ctx.ui.theme;
		ctx.ui.setStatus("ai-x", t.fg("accent", "◉") + t.fg("dim", " ai-x"));

		// Suggested prompts widget above editor
		firstTurn = true;
		showSuggestions(ctx);
	});

	pi.on("session_switch", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		firstTurn = true;
		showSuggestions(ctx);
	});

	pi.on("turn_end", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		if (firstTurn) {
			firstTurn = false;
			ctx.ui.setWidget("suggestions", undefined);
		}
	});
}

function showSuggestions(ctx: any) {
	const theme = ctx.ui.theme;
	ctx.ui.setWidget("suggestions", [
		theme.fg("dim", "  Try: ") +
			theme.fg("muted", "\"What's happening in AI?\"") +
			theme.fg("dim", " · ") +
			theme.fg("muted", "\"What's @karpathy posting?\"") +
			theme.fg("dim", " · ") +
			theme.fg("muted", "\"Search for Claude Code\""),
	]);
}
