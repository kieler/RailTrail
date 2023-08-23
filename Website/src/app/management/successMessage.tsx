/**
 * The success message for any of the management forms
 * @param setSuccess  Function to set the success state of the form component
 * @param setModified Function to set the modified state of the form component
 */
export function SuccessMessage({
	setSuccess,
	setModified
}: {
	setSuccess: (success: boolean) => void;
	setModified: (modified: boolean) => void;
}) {
	return (
		<div className="transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center">
			<div>Änderungen erfolgreich durchgeführt</div>
			<button
				className={"rounded-full bg-gray-700 px-10 text-white"}
				type={"button"}
				onClick={() => {
					setSuccess(false);
					setModified(false);
				}}>
				Weitere Änderung durchführen
			</button>
		</div>
	);
}
