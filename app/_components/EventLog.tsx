"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "react-feather";

export type Event = {
	type: string;
	event_id?: string;
	response?: {
		output?: {
			type: string;
			name: string;
			arguments: string;
		}[];
		instructions?: string;
	};
};

type EventProps = {
	event: Event;
	timestamp: string;
};

function Event({ event, timestamp }: EventProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const isClient = event.event_id && !event.event_id.startsWith("event_");

	return (
		<div className="flex flex-col gap-2 rounded-md bg-gray-50 p-2">
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: */}
			<div
				className="flex cursor-pointer items-center gap-2"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				{isClient ? (
					<ArrowDown className="text-blue-400" />
				) : (
					<ArrowUp className="text-green-400" />
				)}
				<div className="text-gray-500 text-sm">
					{isClient ? "client:" : "server:"}
					&nbsp;{event.type} | {timestamp}
				</div>
			</div>
			<div
				className={`overflow-x-auto rounded-md bg-gray-200 p-2 text-gray-500 ${
					isExpanded ? "block" : "hidden"
				}`}
			>
				<pre className="text-xs">{JSON.stringify(event, null, 2)}</pre>
			</div>
		</div>
	);
}

type EventLogProps = {
	events: Event[];
};

export function EventLog({ events }: EventLogProps) {
	const eventsToDisplay: React.ReactNode[] = [];
	const deltaEvents: {
		[key: string]: Event;
	} = {};

	for (const event of events) {
		if (event.type.endsWith("delta")) {
			if (deltaEvents[event.type]) {
				// for now just log a single event per render pass
				return;
			}
			deltaEvents[event.type] = event;
		}

		eventsToDisplay.push(
			<Event
				key={event.event_id}
				event={event}
				timestamp={new Date().toLocaleTimeString()}
			/>,
		);
	}

	return (
		<div className="flex flex-col gap-2 overflow-x-auto">
			{events.length === 0 ? (
				<div className="text-gray-500">Awaiting events...</div>
			) : (
				eventsToDisplay
			)}
		</div>
	);
}
