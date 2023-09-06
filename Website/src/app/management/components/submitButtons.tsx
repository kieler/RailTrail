import { FormEventHandler } from "react";

export function SubmitButtons({ creating, onDelete }: { creating: boolean; onDelete: FormEventHandler }) {
	return (
		<>
			{/*And finally some buttons to submit the form. The deletion button is only available when an existing vehicle is selected.*/}
			<button type={"submit"} className="col-span-8 rounded-full bg-gray-700 text-white">
				{creating ? "Hinzufügen" : "Ändern"}
			</button>
			<button
				type={"button"}
				className="col-span-8 rounded-full disabled:bg-gray-300 bg-gray-700 text-white"
				onClick={onDelete}
				disabled={creating}>
				Löschen
			</button>
		</>
	);
}
