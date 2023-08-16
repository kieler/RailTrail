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

// var i = 0
const fetcher = async ([url, track_id]: [url: string, track_id: number]) => {
    const res = await fetch(`${url}/${track_id}`, {method: 'get',});
    if (!res.ok) {
        // console.log('not ok!');
        throw new RevalidateError('Re-Fetching unsuccessful', res.status);
    }
    const res_2: Vehicle[] = await res.json();
    return res_2;
    // and add a test vehicle, as the backend is not capable of providing a vehicle at this point
    // const test_vehicle: Vehicle = {
    //     id: 1,
    //     type: 1,
    //     track: track_id,
    //     trackerIds: [],
    //     percentagePosition: 50,
    //     pos: {
    //         lat: 54.17 + 0.05 * Math.cos(i * Math.PI / 180),
    //         lng: 10.56 + 0.085 * Math.sin(i * Math.PI / 180)
    //     },
    //     heading: i + 90,
    //     name: 'foo'
    // };
    // i += 5.1;
    // return res_2.concat([test_vehicle]);
};

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