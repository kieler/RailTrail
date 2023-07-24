"use client";

import {IMapRefreshConfig, RevalidateError} from "@/lib/types";
import {Vehicle} from "@/lib/api.website";
import useSWR from "swr";
import {batteryLevelFormatter, coordinateFormatter} from "@/lib/helpers";
import Link from "next/link";

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
                heading: (i + 90) % 360,
                name: 'foo',
                batteryLevel: 0.5
            };
            //   {id: 42, pos: {lat: 54.2 + 0.05 * Math.cos((i.current + 180) * Math.PI / 180), lng: 10.56 + 0.085 * Math.sin((i.current + 180) * Math.PI / 180) }, heading: i.current - 90, name: 'bar', batteryLevel: 1}
            // ];
            i += 5.1;
            return res.concat([test_vehicle])
        });
};

export default function DynamicList(props: IMapRefreshConfig) {

    const {server_vehicles, track_id, logged_in} = props;
    // console.log(props)

    // const [vehicles, setVehicles] = useState(server_vehicles)
    // const timeoutRef = useRef(undefined as NodeJS.Timeout | undefined);

    const {data, error, isLoading} = useSWR((logged_in && track_id) ? ['/webapi/update', track_id] : null, fetcher, {
        refreshInterval: 1000,
    })

    // console.log(data, error, isLoading);

    const vehicles: Vehicle[] = (isLoading || error || !logged_in || !track_id) ? server_vehicles : data;
    const sorted_vehicles = vehicles.sort((a, b) => a.id - b.id);

    if (logged_in && error) {
        if (error instanceof RevalidateError && error.statusCode == 401) {
            console.log('Invalid token');
            window.location.reload();
        }
        console.log("revalidate error", error)
    }

    return (
        <>
            <h2>{`Fahrzeuge der Strecke ${undefined}`}</h2>
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
                {sorted_vehicles.map((v) => (
                    <tr key={v.id} className={'my-2'}>
                        <td className={'mx-2 px-2 text-center'}>{v.name}</td>
                        <td className={'mx-2 px-2 text-center'}>{coordinateFormatter.format(v.pos.lat)} N</td>
                        <td className={'mx-2 px-2 text-center'}>{coordinateFormatter.format(v.pos.lng)} E</td>
                        <td className={'mx-2 px-2 text-center'}>{v.heading ? coordinateFormatter.format(v.heading) : 'unbekannt'}</td>
                        <td className={'mx-2 px-2 text-center'}>{batteryLevelFormatter.format(v.batteryLevel)}</td>
                        <td className={'mx-2 px-2 text-center'}><Link className="text-blue-600 visited:text-purple-700" href={`/map?focus=${v.id}`}>Link</Link></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </>
    )

}