"use client";

interface ButtonProps {
	icon: React.ReactNode;
	children: React.ReactNode;
	onClick: () => void;
	className?: string;
}

export function Button({ icon, children, onClick, className }: ButtonProps) {
	return (
		<button
			type="button"
			className={`flex items-center gap-1 rounded-full bg-gray-800 p-4 text-white hover:opacity-90 ${className}`}
			onClick={onClick}
		>
			{icon}
			{children}
		</button>
	);
}
