import { Html, Head, Main, NextScript } from "next/document";
import { inter } from "@/utils/common";

/**
 * A custom document that we can use to modify the HTML before something in the `pages` directory is rendered.
 */
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
