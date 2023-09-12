import { HTMLInputTypeAttribute, PropsWithChildren } from "react";

/**
 * An input element with the corresponding label. The label contents are supplied as a child
 */
export function InputWithLabel({
	children,
	id,
	name,
	setModified,
	setValue,
	value,
	type = "text"
}: PropsWithChildren<{
	id: string;
	name: string;
	value: string;
	setValue?: (value: string) => void;
	setModified?: (modified: boolean) => void;
	type?: HTMLInputTypeAttribute;
}>) {
	return (
		<>
			<label htmlFor={id} className={"col-span-3"}>
				{children}
			</label>
			<input
				value={value}
				id={id}
				name={name}
				type={type}
				className="col-span-5 border border-gray-500 dark:bg-slate-700 disabled:text-gray-600 disabled:bg-slate-200 disabled:dark:bg-slate-500 disabled:cursor-not-allowed dark:disabled:text-gray-300 rounded"
				disabled={setValue == undefined}
				onChange={e => {
					if (setValue) {
						setValue(e.target.value);
					}
					if (setModified) {
						setModified(true);
					}
				}}
			/>
		</>
	);
}
