import { PrismaClient, Prisma, Track } from "@prisma/client"

/**
 * TrackController class
 *
 * Handles track specific access to the database.
 * @function    - save()
 *              - update()
 *              - remove()
 *              - getAll()
 *              - getById()
 *              - getByStop()
 *
 */
export default class TrackController {
	constructor(private prisma: PrismaClient) {}

	/**
	 * Saves a tracker in the database.
	 *
	 * The parameter are given via object deconstruction from the model `Track`!
	 * Currently given parameters are:
	 * @param start - Name of the start location.
	 * @param stop - Name of the end location.
	 * @param data - JSON Data of the track
	 * @returns Track
	 */
	public async save(args: Prisma.TrackCreateInput): Promise<Track> {
		return await this.prisma.track.create({
			data: args
		})
	}

	/**
	 * Updates a track in the database.
	 *
	 * @param uid - Indicator which track should be updated
	 *
	 * The parameter are given via object deconstruction from the model `Track`!
	 * Currently given parameters are:
	 * @param start - New name of the start location after change (Optional)
	 * @param stop - New name of the end location after change (Optional)
	 * @param data - New JSON Data of the track after change (Optional)
	 * @returns Track
	 */
	public async update(uid: number, args: Prisma.TrackUpdateInput): Promise<Track> {
		return await this.prisma.track.update({
			where: {
				uid: uid
			},
			data: args
		})
	}

	/**
	 * Removes a track in the database.
	 *
	 * @param uid - Indicator which track should be removed.
	 * @returns True if the removal was successful. Otherwise throws an Error.
	 */
	public async remove(uid: number): Promise<boolean> {
		await this.prisma.track.delete({
			where: {
				uid: uid
			}
		})
		return true
	}

	/**
	 * Returns a list of all tracks.
	 *
	 * @returns Track[] - List of all tracks.
	 */
	public async getAll(): Promise<Track[]> {
		return await this.prisma.track.findMany({})
	}

	/**
	 * Looks up a track given by its uid.
	 *
	 * @param uid - Indicator which track should be searched for.
	 * @returns Track | null depending on if the track could be found.
	 */
	public async getById(uid: number): Promise<Track | null> {
		return await this.prisma.track.findUnique({
			where: {
				uid: uid
			},
			include: {
				poi: true,
				vehicle: true
			}
		})
	}

	/**
	 * Looks up any track that has a start or stop at the given location.
	 *
	 * @param location - Name of the location to check.
	 * @returns Track[] - List of tracks that have either start and/or stop at the given location.
	 */
	public async getByLocation(location: string): Promise<Track[]> {
		return await this.prisma.track.findMany({
			where: {
				OR: [
					{
						start: location
					},
					{
						stop: location
					}
				]
			},
			include: {
				poi: true,
				vehicle: true
			}
		})
	}
}
