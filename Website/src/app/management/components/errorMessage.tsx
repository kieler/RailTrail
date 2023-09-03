/** display an error message if there is an error */
export function ErrorMessage({ error }: { error: string | undefined }) {
	return (
		<>
			{error && (
				<div className="col-span-8 bg-red-300 border-red-600 text-black rounded p-2 text-center">
					Fehler: {error}
				</div>
			)}
		</>
	);
}
