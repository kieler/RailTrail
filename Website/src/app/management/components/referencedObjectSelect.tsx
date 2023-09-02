import { PropsWithChildren, useMemo } from "react";
import { Option } from "@/utils/types";
import { Options } from "react-select";
import { StyledSelect } from "@/app/management/components/styledSelect";

export function ReferencedObjectSelect<ValueType, ObjectType>(
	props: PropsWithChildren<{
		inputId: string;
		name: string;
		value: ValueType;
		setValue: (newValue: ValueType) => void;
		setModified: (modified: boolean) => void;
		objects: ObjectType[];
		mappingFunction: (object: ObjectType) => Option<ValueType>;
		width?: 4 | 5;
	}>
) {
	const defaultValue: Option<"" | ValueType> = useMemo(() => ({ value: "", label: "[Bitte auswählen]" }), []);
	const options: Options<Option<"" | ValueType>> = useMemo(
		() => props.objects.map(props.mappingFunction),
		[props.objects, props.mappingFunction]
	);

	const currentSelection = useMemo(
		() => options.find(({ value: optValue }) => optValue === props.value) ?? defaultValue,
		[options, defaultValue, props.value]
	);

	return (
		<>
			<label htmlFor={props.inputId} className={"col-span-3"}>
				{props.children}
			</label>
			<StyledSelect
				value={currentSelection}
				inputId={props.inputId}
				name={props.name}
				onChange={e => {
					if (e !== null && e.value !== "") {
						props.setValue(e.value);
						props.setModified(true);
					}
				}}
				options={options}
				width={props.width}
			/>
		</>
	);
}
