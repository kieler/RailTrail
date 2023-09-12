import { Options, SingleValue } from "react-select";
import { Option } from "@/utils/types";
import { useMemo } from "react";
import { POIIconCommonName, POIIconImg } from "@/utils/common";
import { POITypeIcon, POITypeIconValues } from "@/utils/api";
import StyledSelect from "@/app/management/components/styledSelect";

const POI_ICONS: POITypeIcon[] = Object.values(POITypeIconValues);

/**
 * A consolidated poi icon selection component
 */
export default function IconSelection({
	currentIcon,
	setIcon,
	setModified,
	id,
	name
}: {
	currentIcon: POITypeIcon | "";
	setIcon: (newIcon: POITypeIcon | "") => void;
	setModified?: (modified: boolean) => void;
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
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={POIIconImg[i]} alt={POIIconCommonName[i]} className={"h-full"} />
						</div>
						<div className={"ml-2 grow whitespace-normal"}>{POIIconCommonName[i]}</div>
					</div>
				)
			})),
		[]
	);
	const defaultIcon: Option<""> = useMemo(
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

	const icon: Option<POITypeIcon | ""> = useMemo(
		() => iconOptions.find(v => v.value === currentIcon) ?? defaultIcon,
		[currentIcon, iconOptions, defaultIcon]
	);
	console.log("Icon for", currentIcon, icon);

	function changeFunction(newValue: SingleValue<Option<POITypeIcon | "">>) {
		if (newValue && newValue.value !== "") {
			setIcon(newValue.value);
			setModified ? setModified(true) : undefined;
		}
	}

	return <StyledSelect inputId={id} name={name} options={iconOptions} value={icon} onChange={changeFunction} />;
}
