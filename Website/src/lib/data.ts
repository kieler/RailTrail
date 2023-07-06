import {AuthenticationRequest, AuthenticationResponse, Vehicle} from "./api.website";


const BACKEND_BASE_PATH = process.env['BACKEND_URI']

export const getVehicleData = async (token: string, track_id: number) => {
    
    const auth_header_line = `Bearer ${token}`
    console.log('Trying Backend at')
    try {
        const x = await fetch(`${BACKEND_BASE_PATH}/api/vehicles/website/${track_id}`, {
            cache: 'no-store', headers:
                {
                    "Authorization": auth_header_line
                }
        })
        if (x.ok) {
          const data: Vehicle[] = await x.json();
          // console.log("data", data);
          return data
        } else {
          console.log("Could not fetch vehicle positions (server)", x.status, x.statusText)
          return []
        }
    } catch (e) {
        console.error("An error fetching", e);
        return [];
    }
  }

export async function authenticate(username: string, password: string): Promise<string | undefined> {
    console.log("Trying to authenticate with", username, password)
    const auth_msg: AuthenticationRequest = { username: username, password: password };
    const auth_resp_json = await fetch(`${BACKEND_BASE_PATH}/api/login/website`, {
        method: "POST", body: JSON.stringify(auth_msg), headers: {
            "Content-Type": "application/json",
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    if (auth_resp_json.ok) {
        const auth_resp: AuthenticationResponse = await auth_resp_json.json();
        return auth_resp.token;
    }
    // return 'aaaaabbbbaaabbabaaa';
    return;
}