# Vehicle Simulator
This application simulates a GPS tracker (Digital Matter Oyster3 LoraWAN) and sends its payload to a backend server as JSON in the same format as the "real" tracker does via Webhook from TheThingsNetwork. For the simulation data, it uses pre-recorded GPX records that were recorded on a trip.
The simulation data covers one trip from Lütjenburg to Malente recorded from multiple smartphones on different handcars with multiple pauses and GPS inaccuracies.
The URI to the backend can be specified using the environment variable `BACKEND_URI`. It has to be a complete URI (more precisely: URL) including protocol (http/https), domain and path (example: `BACKEND_URI=https://railtrail.example/tracker/oyster/lorawan`).

## Operation modes
There are currently three operation modes that simulate different numbers of vehicles and different scenarios.
You can configure this setting via the environment variable `MODE`.
Valid values are `single`, `column` and `collision`. Invalid values will fallback to `single`.

### Single
A single vehicle starts at Lütjenburg and drives to Malente.
When it arrives, it turns around and drives in the other direction back to Lütjenburg. Once it arrives there it turns around again and loops until stopped.
The simulation data for this vehicles comes from `./route/route.gpx` which is a copy of one of the other records.

### Column
A column of vehicles starts at Lütjenburg. This column of vehicles includes one vehicle for every recorded route in the `./routes/` directory.
The individual vehicles behave the same way as in single mode.

### Collision
In collision mode, the simulator starts two vehicles (with different GPX routes). The vehicles travel on a shorted track from Lütjenburg upto somewhere near Lütjenburg.
The two vehicles start at the opposing ends of the shorted track and drive towards each other. At the point of collision, the two vehicles travel "through" each other (since they are only virtual).
This mode is useful for testing alerts in the app or testing if the backend registers that the two vehicles are getting closer to each other.

## Speedup
In order to speed up the whole simulation, the speedup factor can be used to lower the wait times between sending updates.
To set the speedup factor, set the environment variable `SPEEDUP_FACTOR` to a number > 0 (example: `SPEEDUP_FACTOR=2`).
The default speedup factor is 1.
Normally the timestamps from the GPX records is used to determine the wait time between points.
The speedup factor simply divides the GPX time difference between two adjacent points.

## Environment variables overview
Environment variables with their default values:
- `BACKEND_URI=""` (required, valid URI)
- `MODE="single"` (optional, valid values: "single", "column", "collision")
- `SPEEDUP_FACTOR=1` (optional, valid values: number > 0)