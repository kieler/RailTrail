"use client";
import dynamic from 'next/dynamic';
import LoadMapScreen from './loadmap';
import {Vehicle} from "@/utils/api";
import {IMapRefreshConfig, RevalidateError} from '@/utils/types';
import useSWR from "swr";

// This complicated thing with `dynamic` is necessary to disable server side rendering
// for the actual map, which does not work with leaflet.
const _internal_DynamicMap = dynamic(() => import('@/app/components/map'), {
    loading: LoadMapScreen,
    ssr: false
});

// TODO: extract into utility file
const fetcher = async ([url, track_id]: [url: string, track_id: number]) => {
    const res = await fetch(`${url}/${track_id}`, {method: 'get',});
    if (!res.ok) {
        // console.log('not ok!');
        throw new RevalidateError('Re-Fetching unsuccessful', res.status);
    }
    const res_2: Vehicle[] = await res.json();
    return res_2;
};

/**
 * A dynamic map of vehicles with their current position.
 * @param focus                 The id of the vehicle that should be initially focussed on, or undefined if none exists.
 * @param server_vehicles       A pre-fetched list of vehicles to be used until this data is fetched on the client side.
 * @param track_id              The id of the currently selected track.  # TODO: remove redundant variable -> already in track_data
 * @param logged_in             A boolean indicating if the user is logged in.
 * @param track_data            The information about the currently selected track.
 * @param position              The initial center of the map. Effectively only meaningful if focus === undefined.
 * @param zoom_level            The initial zoom level of the map. In Leaflet/OSM zoom levels
 * @param points_of_interest    A server-fetched list of Points of Interest to display on the map.
 */
export default function DynamicMap({
                                       focus,
                                       track_data,
                                       logged_in,
                                       position,
                                       server_vehicles,
                                       track_id,
                                       zoom_level,
                                       points_of_interest,
                                   }: IMapRefreshConfig) {


    // use SWR to periodically re-fetch vehicle positions
    const {data: vehicles, error, isLoading} = useSWR((logged_in && track_id) ? ['/webapi/vehicles/list', track_id] : null, fetcher, {
        refreshInterval: 1000,
        fallbackData: server_vehicles,
    })

    // log the user out if revalidation fails with a 401 response
    if (logged_in && error) {
        if (error instanceof RevalidateError && error.statusCode == 401) {
            console.log('Invalid token');
            window.location.reload();
        }
        console.log("revalidation error", error)
    }

    return (
        // The map needs to have a specified height, so I chose 96 tailwind units.
        // The `grow` class will however still cause the map to take up the available space.
        <div className={'h-96 grow'}>
            <_internal_DynamicMap
                position={position} zoom_level={zoom_level} server_vehicles={vehicles} track_data={track_data} points_of_interest={points_of_interest}
                focus={focus}
            />
        </div>
    )
}