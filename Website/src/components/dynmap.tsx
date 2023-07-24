"use client";
import dynamic from 'next/dynamic';
import LoadMapScreen from './loadmap';
import {Vehicle} from "@/lib/api.website";
import {IMapConfig, IMapRefreshConfig, RevalidateError} from '@/lib/types';
import {useEffect, useRef, useState} from 'react';
import {clearInterval, setInterval} from 'timers';
import {TTuple} from "ts-interface-checker";
import useSWR from "swr";

const _internal_DynamicMap = dynamic(() => import('@/components/map'), {
    loading: LoadMapScreen,
    ssr: false
});

var i = 0
const fetcher = ([url, track_id]: [url: string, track_id: number]) => {
    return fetch(url, {method: 'post', body: JSON.stringify({track_id})}).then(
        async (res: Response) => {
            if (!res.ok) {
                // console.log('not ok!');
                throw new RevalidateError('Re-Fetching unsuccessful', res.status);
            }
            //console.log('ok')
            return res;
        }
    ).then(res => res.json())
        .then(res => {
            // console.log(res);
            const test_vehicle: Vehicle = {
                id: 0,
                pos: {
                    lat: 54.17 + 0.05 * Math.cos(i * Math.PI / 180),
                    lng: 10.56 + 0.085 * Math.sin(i * Math.PI / 180)
                },
                heading: i + 90,
                name: 'foo',
                batteryLevel: 0.5
            };
            //   {id: 42, pos: {lat: 54.2 + 0.05 * Math.cos((i.current + 180) * Math.PI / 180), lng: 10.56 + 0.085 * Math.sin((i.current + 180) * Math.PI / 180) }, heading: i.current - 90, name: 'bar', batteryLevel: 1}
            // ];
            i += 5.1;
            return res.concat([test_vehicle])
        });
};

export default function DynamicMap(props: IMapRefreshConfig) {

    const {position, zoom_level, server_vehicles, track_id, logged_in, init_data, focus} = props;
    // console.log(props)

    // const [vehicles, setVehicles] = useState(server_vehicles)
    // const timeoutRef = useRef(undefined as NodeJS.Timeout | undefined);

    const {data, error, isLoading} = useSWR((logged_in && track_id) ? ['/api/update', track_id] : null, fetcher, {
        refreshInterval: 1000,
    })

    // console.log(data, error, isLoading);

    const vehicles = (isLoading || error || !logged_in || !track_id) ? server_vehicles : data;

    if (logged_in && error) {
        if (error instanceof RevalidateError && error.statusCode == 401) {
            console.log('Invalid token');
            window.location.reload();
        }
        console.log("revalidate error", error)
    }

    return (
        <div className={'h-96 grow'}>
            <_internal_DynamicMap
                position={position} zoom_level={zoom_level} server_vehicles={vehicles} init_data={init_data} focus={focus}
            />
        </div>
    )
}