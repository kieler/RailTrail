"use client";

import {IMapRefreshConfig, RevalidateError} from "@/utils/types";
import {Vehicle} from "@/utils/api";
import useSWR from "swr";
import {batteryLevelFormatter, coordinateFormatter} from "@/utils/helpers";
import Link from "next/link";

const fetcher = async ([url, track_id]: [url: string, track_id: number]) => {
    const res = await fetch(`${url}/${track_id}`, {method: 'get',});
    if (!res.ok) {
        // console.log('not ok!');
        throw new RevalidateError('Re-Fetching unsuccessful', res.status);
    }
    const res_2: Vehicle[] = await res.json();
    return res_2;
}

export default function DynamicList(props: IMapRefreshConfig) {

    const {server_vehicles, track_id, logged_in, track_data} = props;

    const {data, error, isLoading} = useSWR((logged_in && track_id) ? ['/webapi/vehicles/list', track_id] : null, fetcher, {
        refreshInterval: 1000,
    })

    // console.log(data, error, isLoading);

    const vehicles: Vehicle[] | undefined = (isLoading || error || !logged_in || !track_id) ? server_vehicles : data;
    const sorted_vehicles = vehicles?.sort((a, b) => a.id - b.id);

    if (logged_in && error) {
        if (error instanceof RevalidateError && error.statusCode == 401) {
            console.log('Invalid token');
            window.location.reload();
        }
        console.log("revalidate error", error)
    }

    return (
        <>
            <h2>Fahrzeuge der Strecke {track_data?.start} - {track_data?.end}</h2>
            <table className={'table-auto border-collapse w-full'}>
                <thead>
                    <tr className={'my-2'}>
                        <th className={'mx-2 border-b-black border-b px-2'}>Name</th>
                        <th className={'mx-2 border-b-black border-b px-2'}>geog. Breite</th>
                        <th className={'mx-2 border-b-black border-b px-2'}>geog. Länge</th>
                        <th className={'mx-2 border-b-black border-b px-2'}>Richtung</th>
                        <th className={'mx-2 border-b-black border-b px-2'}>Batterieladung</th>
                        <th className={'mx-2 border-b-black border-b px-2'}>Auf Karte anzeigen</th>
                    </tr>
                </thead>
                <tbody>
                {sorted_vehicles?.map((v) => (
                    <tr key={v.id} className={'my-2'}>
                        <td className={'mx-2 px-2 text-center'}>{v.name}</td>
                        <td className={'mx-2 px-2 text-center'}>{v.pos ? coordinateFormatter.format(v.pos.lat) : 'unbekannt'} N</td>
                        <td className={'mx-2 px-2 text-center'}>{v.pos ? coordinateFormatter.format(v.pos.lng): 'unbekannt'} E</td>
                        <td className={'mx-2 px-2 text-center'}>{v.heading ? coordinateFormatter.format(v.heading) : 'unbekannt'}</td>
                        <td className={'mx-2 px-2 text-center'}>{({}.toString())}</td>
                        <td className={'mx-2 px-2 text-center'}><Link className="text-blue-600 visited:text-purple-700" href={`/map?focus=${v.id}`}>Link</Link></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </>
    )

}