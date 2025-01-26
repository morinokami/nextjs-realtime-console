"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { type Event, EventLog } from "./_components/EventLog";
import { SessionControls } from "./_components/SessionControls";
import { ToolPanel } from "./_components/ToolPanel";

export default function App() {
	const [isSessionActive, setIsSessionActive] = useState(false);
	const [events, setEvents] = useState<Event[]>([]);
	const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
	const peerConnection = useRef<RTCPeerConnection | null>(null);
	const audioElement = useRef<HTMLAudioElement | null>(null);

	async function startSession() {
		// Get an ephemeral key from the Fastify server
		const tokenResponse = await fetch("/token");
		const data = await tokenResponse.json();
		const EPHEMERAL_KEY = data.client_secret.value;

		// Create a peer connection
		const pc = new RTCPeerConnection();

		// Set up to play remote audio from the model
		audioElement.current = document.createElement("audio");
		audioElement.current.autoplay = true;
		pc.ontrack = (e) => {
			if (audioElement.current) {
				audioElement.current.srcObject = e.streams[0];
			}
		};

		// Add local audio track for microphone input in the browser
		const ms = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		pc.addTrack(ms.getTracks()[0]);

		// Set up data channel for sending and receiving events
		const dc = pc.createDataChannel("oai-events");
		setDataChannel(dc);

		// Start the session using the Session Description Protocol (SDP)
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		const baseUrl = "https://api.openai.com/v1/realtime";
		const model = "gpt-4o-realtime-preview-2024-12-17";
		const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
			method: "POST",
			body: offer.sdp,
			headers: {
				Authorization: `Bearer ${EPHEMERAL_KEY}`,
				"Content-Type": "application/sdp",
			},
		});

		const answer = {
			type: "answer",
			sdp: await sdpResponse.text(),
		} as const;
		await pc.setRemoteDescription(answer);

		peerConnection.current = pc;
	}

	// Stop current session, clean up peer connection and data channel
	function stopSession() {
		if (dataChannel) {
			dataChannel.close();
		}
		if (peerConnection.current) {
			peerConnection.current.close();
		}

		setIsSessionActive(false);
		setDataChannel(null);
		peerConnection.current = null;
	}

	// Send a message to the model
	function sendClientEvent(message: Event) {
		if (dataChannel) {
			message.event_id = message.event_id || crypto.randomUUID();
			dataChannel.send(JSON.stringify(message));
			setEvents((prev) => [message, ...prev]);
		} else {
			console.error(
				"Failed to send message - no data channel available",
				message,
			);
		}
	}

	// Send a text message to the model
	function sendTextMessage(message: string) {
		const event = {
			type: "conversation.item.create",
			item: {
				type: "message",
				role: "user",
				content: [
					{
						type: "input_text",
						text: message,
					},
				],
			},
		};

		sendClientEvent(event);
		sendClientEvent({ type: "response.create" });
	}

	// Attach event listeners to the data channel when a new one is created
	useEffect(() => {
		if (dataChannel) {
			// Append new server events to the list
			dataChannel.addEventListener("message", (e) => {
				setEvents((prev) => [JSON.parse(e.data), ...prev]);
			});

			// Set session active when the data channel is opened
			dataChannel.addEventListener("open", () => {
				setIsSessionActive(true);
				setEvents([]);
			});
		}
	}, [dataChannel]);

	return (
		<>
			<nav className="absolute top-0 right-0 left-0 flex h-16 items-center">
				<div className="m-4 flex w-full items-center gap-4 border-0 border-gray-200 border-b border-solid pb-2">
					<Image
						src="/openai-logomark.svg"
						alt="OpenAI Logo"
						width={24}
						height={24}
					/>
					<h1>realtime console</h1>
				</div>
			</nav>
			<main className="absolute top-16 right-0 bottom-0 left-0">
				<section className="absolute top-0 right-[380px] bottom-0 left-0 flex">
					<section className="absolute top-0 right-0 bottom-32 left-0 overflow-y-auto px-4">
						<EventLog events={events} />
					</section>
					<section className="absolute right-0 bottom-0 left-0 h-32 p-4">
						<SessionControls
							startSession={startSession}
							stopSession={stopSession}
							sendTextMessage={sendTextMessage}
							isSessionActive={isSessionActive}
						/>
					</section>
				</section>
				<section className="absolute top-0 right-0 bottom-0 w-[380px] overflow-y-auto p-4 pt-0">
					<ToolPanel
						sendClientEvent={sendClientEvent}
						events={events}
						isSessionActive={isSessionActive}
					/>
				</section>
			</main>
		</>
	);
}
