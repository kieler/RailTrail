import { UnauthorizedError } from "@/utils/types";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import Link from "next/link";
import { ReloadButton } from "@/app/components/reloadButton";

/**
 * Display a specialized error message for server side exceptions
 * @param error The relevant exception thrown.
 */
export function ExceptionMessage({ error }: { error: unknown }) {
	const InternalComponent = () => {
		if (error instanceof UnauthorizedError) {
			return (
				<>
					<div className={"w-full"}>
						<ErrorMessage error={"Ihre Anmeldung ist abgelaufen"} />
					</div>
					<Link
						className={"rounded-full bg-gray-700 px-10 text-white no-a-style w-60 text-center"}
						href={"/logout"}
						prefetch={false}>
						Erneut anmelden
					</Link>
				</>
			);
		} else if (error instanceof Error) {
			return <ErrorMessage error={error.message} />;
		} else if (error instanceof Object) {
			return <ErrorMessage error={error.toString()} />;
		} else if (typeof error === "string") {
			return <ErrorMessage error={error} />;
		}
		return <ErrorMessage error={"Etwas Unerwartetes ist passiert."} />;
	};

	return (
		<div className={"flex items-center flex-col gap-2"}>
			<InternalComponent />
			<ReloadButton className={"rounded-full bg-gray-700 px-10 text-white no-a-style w-60 text-center"}>
				Erneut versuchen
			</ReloadButton>
		</div>
	);
}
