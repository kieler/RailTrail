
import {cookies} from 'next/headers';
import {getInitData, getVehicleData} from '@/utils/data';
import LoginWrapper from "@/app/components/login_wrap";
import {InitResponse, Vehicle} from "@/utils/api.website";
import DynamicList from "@/app/components/dynlist";

export default async function Home() {

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

    console.log("server vehicles", server_vehicles)
    return (
        <main className="container mx-auto max-w-4xl grow">
            <div className={'bg-white p-4 rounded'}>
            <LoginWrapper logged_in={token !== undefined} track_selected={track_selected} map_conf={
                {
                    position: {lat: 54.2333, lng: 10.6024},
                    zoom_level: 11,
                    server_vehicles,
                    init_data,
                    track_id
                }
            } child={DynamicList}/>
        </div>
        </main>
    )
}
