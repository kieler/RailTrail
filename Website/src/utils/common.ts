import { Inter } from "next/font/google";
import { POITypeIcon, POITypeIconValues } from "@/utils/api";

export const inter = Inter({ subsets: ["latin"] });

export const meta_info = {
	title: "RailTrail Admin Interface",
	description: "An administrative interface for the RailTrail rail vehicle management system."
};

export const POIIconImg: Readonly<Record<POITypeIcon, string>> = {
	[POITypeIconValues.Generic]: "/poiTypeIcons/generic.svg",
	[POITypeIconValues.LevelCrossing]: "/poiTypeIcons/level_crossing.svg",
	[POITypeIconValues.LesserLevelCrossing]: "/poiTypeIcons/lesser_level_crossing.svg",
	[POITypeIconValues.Picnic]: "/poiTypeIcons/picnic.svg",
	[POITypeIconValues.TrackEnd]: "/poiTypeIcons/track_end.svg",
	[POITypeIconValues.TurningPoint]: "/poiTypeIcons/turning_point.svg"
} as const;

export const POIIconCommonName: Readonly<Record<POITypeIcon, string>> = {
	[POITypeIconValues.Generic]: "Generisch",
	[POITypeIconValues.LevelCrossing]: "Bahnübergang",
	[POITypeIconValues.LesserLevelCrossing]: "Unbeschilderter Bahnübergang",
	[POITypeIconValues.Picnic]: "Picknickplatz",
	[POITypeIconValues.TrackEnd]: "Streckenende",
	[POITypeIconValues.TurningPoint]: "Wendepunkt"
} as const;
