import "~/styles/globals.css";

import type { Metadata } from "next";
import { Roboto } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "Neiji",
	description: "The first meditation avaible to everyone",
	icons: [{ rel: "icon", url: "/logo.png" }],
	openGraph: {
		title: "Neiji - Meditation for Everyone",
		description: "The first meditation avaible to everyone",
		type: "website",
		url: "https://neiji.co",
		siteName: "Neiji",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "Neiji - Meditation App"
			}
		]
	},
	twitter: {
		card: "summary_large_image",
		title: "Neiji - Meditation for Everyone",
		description: "The first meditation avaible to everyone",
		images: ["/og-image.jpg"]
	}
};

const roboto = Roboto({
	subsets: ["latin"],
	variable: "--font-roboto-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${roboto.variable}`}>
			<body>
				<TRPCReactProvider>{children}</TRPCReactProvider>
			</body>
		</html>
	);
}
