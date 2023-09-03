import { PropsWithChildren, useMemo } from "react";
import { Option } from "@/utils/types";
import { Options } from "react-select";
import { StyledSelect } from "@/app/management/components/styledSelect";

/**
 * A selection element for specifying a relation to one of `objects`
 * @param children 			The label for the selection
 * @param inputId			The id of the selection input
 * @param name				The name of the selection input
 * @param value				The id of the currently selected object
 * @param setValue			Function to set the id of the selected object
 * @param setModified		Function to set the form state to modified
 * @param objects			Objects which can be selected
 * @param mappingFunction	Function mapping an object to a selectable option (i.e. a Option<ValueType>)
 * @param width				The grid-width of the selection thingy.
 */
export function ReferencedObjectSelect<ValueType, ObjectType>({
	children,
	inputId,
	mappingFunction,
	name,
	objects,
	setModified,
	setValue,
	value,
	width
}: PropsWithChildren<{
	inputId: string;
	name: string;
	value: ValueType;
	setValue: (newValue: ValueType) => void;
	setModified: (modified: true) => void;
	objects: ObjectType[];
	mappingFunction: (object: ObjectType) => Option<ValueType>;
	width?: 4 | 5;
}>) {
	const defaultValue: Option<"" | ValueType> = useMemo(() => ({ value: "", label: "[Bitte auswählen]" }), []);
	const options: Options<Option<"" | ValueType>> = useMemo(
		() => objects.map(mappingFunction),
		[objects, mappingFunction]
	);

	const currentSelection = useMemo(
		() => options.find(({ value: optValue }) => optValue === value) ?? defaultValue,
		[options, defaultValue, value]
	);

	return (
		<>
			<label htmlFor={inputId} className={"col-span-3"}>
				{children}
			</label>
			<StyledSelect
				value={currentSelection}
				inputId={inputId}
				name={name}
				onChange={e => {
					if (e !== null && e.value !== "") {
						setValue(e.value);
						setModified(true);
					}
				}}
				options={options}
				width={width}
			/>
		</>
	);
}
