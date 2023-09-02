export function ErrorMessage({ error }: { error: string | undefined }) {
	return (
		<>
			{" "}
			{
				/* display an error message if there is an error */ error && (
					<div className="col-span-8 bg-red-300 border-red-600 text-black rounded p-2 text-center">
						{error}
					</div>
				)
			}{" "}
		</>
	);
}
