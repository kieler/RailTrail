//import Map from '@/components/map'

import DynamicMap from '@/components/dynmap';
import {cookies} from 'next/headers';
import {getInitData, getVehicleData} from '@/lib/data';
import LoginWrapper from "@/components/login_wrap";
import {InitResponse, Vehicle} from "@/lib/api.website";
import {nanToUndefined} from "@/lib/helpers";

export default async function Home({searchParams}: { searchParams: { focus?: string, success?: string }  }) {

    console.log('params', searchParams);

    const token = cookies().get("token")?.value;
    const track_id = parseInt(cookies().get("track_id")?.value ?? '', 10)
    const track_selected = !isNaN(track_id);
    let server_vehicles: Vehicle[];
    let init_data: InitResponse | undefined;
    try {
        init_data = (token && track_selected) ? await getInitData(token, track_id) : undefined;
        server_vehicles = (token && track_selected) ? await getVehicleData(token, track_id) : [];
    } catch (e) {
        console.error('Catched e:', e);
        init_data = undefined;
        server_vehicles = []
    }
    const focus = nanToUndefined(parseInt(searchParams.focus ?? '', 10));

    console.log("server vehicles", server_vehicles)
    return (
        <LoginWrapper logged_in={token !== undefined} track_selected={track_selected} map_conf={
            {
                position: {lat: 54.2333, lng: 10.6024},
                zoom_level: 11.5,
                server_vehicles,
                track_id,
                init_data,
                focus
            }
        } child={DynamicMap}/>
    )
}
