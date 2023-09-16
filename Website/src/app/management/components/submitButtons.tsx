import { FormEventHandler } from "react";

/**
 * A pair of buttons for the management forms. Contains a form submit button with text either being "Hinzufügen" or "Ändern",
 * and a delete button.
 * @param creating  Flag to indicate whether the form is in create mode
 * @param onDelete	Function to call when the delete button is clicked.
 * @constructor
 */
export function SubmitButtons({ creating, onDelete }: { creating: boolean; onDelete: FormEventHandler }) {
	return (
		<>
			{/*And finally some buttons to submit the form. The deletion button is only available when an existing vehicle is selected.*/}
			<button type={"submit"} className="col-span-8 rounded-full bg-gray-700 text-white">
				{creating ? "Hinzufügen" : "Ändern"}
			</button>
			<button
				type={"button"}
				className="col-span-8 rounded-full disabled:bg-gray-300 disabled:dark:text-gray-800 disabled:cursor-not-allowed bg-gray-700 text-white"
				onClick={onDelete}
				disabled={creating}>
				Löschen
			</button>
		</>
	);
}
