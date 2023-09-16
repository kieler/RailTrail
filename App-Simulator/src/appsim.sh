# Arg1: number of concurrent requests, Arg2: sleep time between request bursts in seconds
while true; do
    for i in $(seq 1 $1); do
    {
curl -X PUT http://localhost:8080/api/vehicles/app --json '{"vehicleId":1, "pos": {"lat": 54.279806, "lng": 10.611638}, "speed":15, "heading":1, "timestamp": ' --json "$(date +%s%3N)" --json ' }';        printf " - Response from request: ${i}\n";
    } &
    done;
    sleep $2;
done