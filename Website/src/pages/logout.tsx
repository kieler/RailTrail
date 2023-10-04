import "@/app/components/globals.css";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { deleteCookie, hasCookie } from "cookies-next";
import Head from "next/head";
import { meta_info } from "@/utils/common";
import { FormWrapper } from "@/app/components/form";
import Link from "next/link";

/**
 * Executed on the server side on page load. See: https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props
 *
 * Will check if the token-cookie exists in the request, and if it
 * exists will add a header in the response to delete the token cookie.
 */
export const getServerSideProps: GetServerSideProps<{
	success: boolean;
}> = async ({ req, res }) => {
	let success = false;

	if (
		hasCookie("token", {
			httpOnly: true,
			sameSite: "lax",
			req,
			res
		})
	) {
		deleteCookie("token", {
			httpOnly: true,
			sameSite: "lax",
			req,
			res
		});
		success = true;
	}
	return { props: { success } };
};

/**
 * The content shown on the logout page.
 * @param success Whether the user has been logged out, or wasn't logged-in.
 */
export default function Page({ success }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<>
			<Head>
				{/* Include the generic metadata for this page */}
				<title>{meta_info.title}</title>
				<meta name={"description"} content={meta_info.description} />
			</Head>
			<FormWrapper>
				{success ? <p>Sie wurden ausgeloggt.</p> : <p>Sie waren nicht eingeloggt.</p>}
				<p>Möchten Sie sich wieder einloggen?</p>
				<Link href={"/login"} className={"rounded-full bg-gray-700 px-10 text-white no-a-style"}>
					Zum Login
				</Link>
			</FormWrapper>
		</>
	);
}
