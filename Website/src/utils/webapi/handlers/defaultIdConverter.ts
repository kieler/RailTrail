import { nanToUndefined } from "@/utils/helpers";

/**
 * The default converter from a string id to a number
 * @param id	the id string
 */
export function defaultIdConverter(id: string): number | undefined {
	// cast the vehicle type to a number
	const poiTypeID = +id;

	// check if the vehicleTypeID is a number
	return nanToUndefined(poiTypeID);
}
