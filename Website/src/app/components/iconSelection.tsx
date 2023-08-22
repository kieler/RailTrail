import Select, { Options, SingleValue } from "react-select";
import { Option } from "@/utils/types";
import { useMemo } from "react";

export const icons = [
	{ path: "/poiTypeIcons/generic_rail_bound_vehicle.svg", name: "Schienenfahrzeug" },
	{ path: "/poiTypeIcons/level_crossing.svg", name: "Bahnübergang" },
	{ path: "/poiTypeIcons/lesser_level_crossing.svg", name: "Unbeschilderter Bahnübergang" },
	{ path: "/poiTypeIcons/parking.svg", name: "Haltepunkt" }
];

/**
 * A consolidated icon selection component
 */
export default function IconSelection({
	currentIcon,
	setIcon,
	setModified,
	className,
	id,
	name
}: {
	currentIcon: string;
	setIcon: (newIcon: string) => void;
	setModified?: (modified: boolean) => void;
	className?: string;
	id: string;
	name: string;
}) {
	const iconOptions: Options<Option<string>> = useMemo(
		() =>
			icons.map(i => ({
				value: i.path,
				label: (
					<div key={i.path} className={"flex items-center h-20"}>
						<img src={i.path} alt={i.name} className={"h-full w-auto"} />
						<div className={"ml-2"}>{i.name}</div>
					</div>
				)
			})),
		[]
	);
	const defaultIcon: Option<string> = useMemo(
		() => ({
			value: "",
			label: (
				<div key={""} className={"flex items-center h-20"}>
					[Bitte auswählen]
				</div>
			)
		}),
		[]
	);

	const icon = useMemo(
		() => iconOptions.find(v => v.value === currentIcon) ?? defaultIcon,
		[currentIcon, iconOptions, defaultIcon]
	);
	console.log("Icon for", currentIcon, icon);

	function changeFunction(newValue: SingleValue<Option<string>>) {
		if (newValue) {
			setIcon(newValue.value);
			setModified ? setModified(true) : undefined;
		}
	}

	return (
		<Select
			className={className}
			inputId={id}
			name={name}
			options={iconOptions}
			value={icon}
			onChange={changeFunction}
		/>
	);
}
