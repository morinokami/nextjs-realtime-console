"use client";

import { useEffect, useState } from "react";
import type { Event } from "./EventLog";

const functionDescription = `
Call this function when a user asks for a color palette.
`;

const sessionUpdate = {
	type: "session.update",
	session: {
		tools: [
			{
				type: "function",
				name: "display_color_palette",
				description: functionDescription,
				parameters: {
					type: "object",
					strict: true,
					properties: {
						theme: {
							type: "string",
							description: "Description of the theme for the color scheme.",
						},
						colors: {
							type: "array",
							description: "Array of five hex color codes based on the theme.",
							items: {
								type: "string",
								description: "Hex color code",
							},
						},
					},
					required: ["theme", "colors"],
				},
			},
		],
		tool_choice: "auto",
	},
};

type FunctionCallOutputProps = {
	functionCallOutput: {
		type: string;
		name: string;
		arguments: string;
	};
};

function FunctionCallOutput({ functionCallOutput }: FunctionCallOutputProps) {
	const { theme, colors } = JSON.parse(functionCallOutput.arguments) as {
		theme: string;
		colors: string[];
	};

	const colorBoxes = colors.map((color) => (
		<div
			key={color}
			className="flex h-16 w-full items-center justify-center rounded-md border border-gray-200"
			style={{ backgroundColor: color }}
		>
			<p className="rounded-md border border-black bg-slate-100 p-2 font-bold text-black text-sm">
				{color}
			</p>
		</div>
	));

	return (
		<div className="flex flex-col gap-2">
			<p>Theme: {theme}</p>
			{colorBoxes}
			<pre className="overflow-x-auto rounded-md bg-gray-100 p-2 text-xs">
				{JSON.stringify(functionCallOutput, null, 2)}
			</pre>
		</div>
	);
}

type ToolPanelProps = {
	isSessionActive: boolean;
	sendClientEvent: (message: Event) => void;
	events: Event[];
};

export function ToolPanel({
	isSessionActive,
	sendClientEvent,
	events,
}: ToolPanelProps) {
	const [functionAdded, setFunctionAdded] = useState(false);
	const [functionCallOutput, setFunctionCallOutput] = useState<{
		type: string;
		name: string;
		arguments: string;
	} | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
		if (!events || events.length === 0) return;

		const firstEvent = events[events.length - 1];
		if (!functionAdded && firstEvent.type === "session.created") {
			sendClientEvent(sessionUpdate);
			setFunctionAdded(true);
		}

		const mostRecentEvent = events[0];
		if (
			mostRecentEvent.type === "response.done" &&
			mostRecentEvent.response?.output
		) {
			for (const output of mostRecentEvent.response.output) {
				if (
					output.type === "function_call" &&
					output.name === "display_color_palette"
				) {
					setFunctionCallOutput(output);
					setTimeout(() => {
						sendClientEvent({
							type: "response.create",
							response: {
								instructions: `
                ask for feedback about the color palette - don't repeat 
                the colors, just ask if they like the colors.
              `,
							},
						});
					}, 500);
				}
			}
		}
	}, [events]);

	useEffect(() => {
		if (!isSessionActive) {
			setFunctionAdded(false);
			setFunctionCallOutput(null);
		}
	}, [isSessionActive]);

	return (
		<section className="flex h-full w-full flex-col gap-4">
			<div className="h-full rounded-md bg-gray-50 p-4">
				<h2 className="font-bold text-lg">Color Palette Tool</h2>
				{isSessionActive ? (
					functionCallOutput ? (
						<FunctionCallOutput functionCallOutput={functionCallOutput} />
					) : (
						<p>Ask for advice on a color palette...</p>
					)
				) : (
					<p>Start the session to use this tool...</p>
				)}
			</div>
		</section>
	);
}
