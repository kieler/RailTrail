import Select, { Options, SingleValue } from "react-select";
import { Option } from "@/utils/types";
import { useMemo } from "react";
import { POIIconCommonName, POIIconImg } from "@/utils/common";
import { POITypeIcon, POITypeIconValues } from "@/utils/api";

const POI_ICONS: POITypeIcon[] = Object.values(POITypeIconValues);

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
	currentIcon: POITypeIcon | null;
	setIcon: (newIcon: POITypeIcon | null) => void;
	setModified?: (modified: boolean) => void;
	className?: string;
	id: string;
	name: string;
}) {
	const iconOptions: Options<Option<POITypeIcon>> = useMemo(
		() =>
			POI_ICONS.map(i => ({
				value: i,
				label: (
					<div key={i} className={"flex items-center h-20"}>
						<div className={"base-20 shrink-0 h-full"}>
							<img src={POIIconImg[i]} alt={POIIconCommonName[i]} className={"h-full"} />
						</div>
						<div className={"ml-2 grow whitespace-normal"}>{POIIconCommonName[i]}</div>
					</div>
				)
			})),
		[]
	);
	const defaultIcon: Option<null> = useMemo(
		() => ({
			value: null,
			label: (
				<div key={""} className={"flex items-center h-20"}>
					[Bitte auswählen]
				</div>
			)
		}),
		[]
	);

	const icon: Option<POITypeIcon | null> = useMemo(
		() => iconOptions.find(v => v.value === currentIcon) ?? defaultIcon,
		[currentIcon, iconOptions, defaultIcon]
	);
	console.log("Icon for", currentIcon, icon);

	function changeFunction(newValue: SingleValue<Option<POITypeIcon | null>>) {
		if (newValue && newValue.value !== null) {
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
