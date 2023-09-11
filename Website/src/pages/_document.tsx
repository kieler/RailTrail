import { Html, Head, Main, NextScript } from "next/document";
import { inter } from "@/utils/common";

export default function Document() {
	return (
		<Html lang={"de"}>
			<Head></Head>
			<body className={inter.className}>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
