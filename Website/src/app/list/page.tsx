
import {cookies} from 'next/headers';
import {getTrackData, getAllVehiclesOnTrack, getAllPOIsOnTrack} from '@/utils/data';
import LoginWrapper from "@/app/components/login_wrap";
import {FullTrack, PointOfInterest, Vehicle} from "@/utils/api";
import DynamicList from "@/app/components/dynlist";

export default async function Home() {

    const token = cookies().get("token")?.value;
    const track_id = parseInt(cookies().get("track_id")?.value ?? '', 10)
    const track_selected = !isNaN(track_id);
    const [track_data, server_vehicles, points_of_interest]: [FullTrack | undefined, Vehicle[], PointOfInterest[]] = !(token && track_selected)
        ? [undefined, [] as Vehicle[], [] as PointOfInterest[]]
        : await Promise.all([getTrackData(token, track_id), getAllVehiclesOnTrack(token, track_id), getAllPOIsOnTrack(token, track_id)]).catch((e) => {
            console.error('Error fetching Map Data from the Backend:', e);
            return [undefined, [], []];
        });

    console.log("server vehicles", server_vehicles)
    return (
        <main className="container mx-auto max-w-4xl grow">
            <div className={'bg-white p-4 rounded'}>
            <LoginWrapper logged_in={token !== undefined} track_selected={track_selected} map_conf={
                {
                    position: {lat: 54.2333, lng: 10.6024},
                    zoom_level: 11,
                    server_vehicles,
                    track_data,
                    track_id,
                    points_of_interest
                }
            } child={DynamicList}/>
        </div>
        </main>
    )
}
