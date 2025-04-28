import "~/styles/globals.css";

import type { Metadata } from "next";
import { Roboto } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "Neiji",
	description: "The first meditation avaible to everyone",
	icons: [{ rel: "icon", url: "/logo.png" }],
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
