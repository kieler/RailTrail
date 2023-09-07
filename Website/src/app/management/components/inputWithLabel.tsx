import { PropsWithChildren } from "react";

/**
 * An input element with the corresponding label. The label contents are supplied as a child
 */
export function InputWithLabel({
	children,
	id,
	name,
	setModified,
	setValue,
	value
}: PropsWithChildren<{
	id: string;
	name: string;
	value: string;
	setValue: (value: string) => void;
	setModified: (modified: boolean) => void;
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
				className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
				onChange={e => {
					setValue(e.target.value);
					setModified(true);
				}}
			/>
		</>
	);
}
