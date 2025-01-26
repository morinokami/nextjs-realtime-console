"use client";

import { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import { Button } from "./Button";

type SessionStoppedProps = {
	startSession: () => void;
};

function SessionStopped({ startSession }: SessionStoppedProps) {
	const [isActivating, setIsActivating] = useState(false);

	function handleStartSession() {
		if (isActivating) return;

		setIsActivating(true);
		startSession();
	}

	return (
		<div className="flex h-full w-full items-center justify-center">
			<Button
				onClick={handleStartSession}
				className={isActivating ? "bg-gray-600" : "bg-red-600"}
				icon={<CloudLightning height={16} />}
			>
				{isActivating ? "starting session..." : "start session"}
			</Button>
		</div>
	);
}

type SessionActiveProps = {
	stopSession: () => void;
	sendTextMessage: (message: string) => void;
};

function SessionActive({ stopSession, sendTextMessage }: SessionActiveProps) {
	const [message, setMessage] = useState("");

	function handleSendClientEvent() {
		sendTextMessage(message);
		setMessage("");
	}

	return (
		<div className="flex h-full w-full items-center justify-center gap-4">
			<input
				onKeyDown={(e) => {
					if (e.key === "Enter" && message.trim()) {
						handleSendClientEvent();
					}
				}}
				type="text"
				placeholder="send a text message..."
				className="flex-1 rounded-full border border-gray-200 p-4"
				value={message}
				onChange={(e) => setMessage(e.target.value)}
			/>
			<Button
				onClick={() => {
					if (message.trim()) {
						handleSendClientEvent();
					}
				}}
				icon={<MessageSquare height={16} />}
				className="bg-blue-400"
			>
				send text
			</Button>
			<Button onClick={stopSession} icon={<CloudOff height={16} />}>
				disconnect
			</Button>
		</div>
	);
}

type SessionControlsProps = {
	startSession: () => void;
	stopSession: () => void;
	sendTextMessage: (message: string) => void;
	isSessionActive: boolean;
};

export function SessionControls({
	startSession,
	stopSession,
	sendTextMessage,
	isSessionActive,
}: SessionControlsProps) {
	return (
		<div className="flex h-full gap-4 rounded-md border-gray-200 border-t-2">
			{isSessionActive ? (
				<SessionActive
					stopSession={stopSession}
					sendTextMessage={sendTextMessage}
				/>
			) : (
				<SessionStopped startSession={startSession} />
			)}
		</div>
	);
}
