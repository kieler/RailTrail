export const backendUrl = "https://railtrail.nicobiernat.de/api"
// https://railtrail.nicobiernat.de/api
// http://localhost:8080/api

export const BACKEND_TIMEOUT = 3000
export const EXTERNAL_POSITION_UPDATE_INTERVALL = 3000
export const MIN_LOCATION_UPDATE_TIME_INTERVAL = 1000
export const MIN_LOCATION_UPDATE_DISTANCE_INTERVAL = 0.1
export const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK"
export const VEHICLE_HEADING_TOWARDS_USER_WARNING_DISTANCE = 200
export const VEHICLE_WARNING_DISTANCE = 10
export const LEVEL_CROSSING_WARNING_DISTANCE = 200

export const initialRegion = {
  latitude: 54.16757,
  longitude: 10.551278,
  latitudeDelta: 0.0015,
  longitudeDelta: 0.00075,
}

export const track: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [10.601082, 54.292968],
          [10.601622, 54.292682],
          [10.602251, 54.292336],
          [10.602583, 54.292153],
          [10.602842, 54.291954],
          [10.602842, 54.291954],
          [10.603333, 54.29155],
          [10.603333, 54.29155],
          [10.603473, 54.291421],
          [10.603787, 54.291046],
          [10.604059, 54.290669],
          [10.604059, 54.290669],
          [10.604275, 54.290375],
          [10.604275, 54.290375],
          [10.605892, 54.288168],
          [10.606252, 54.2877],
          [10.609718, 54.283111],
          [10.610611, 54.281917],
          [10.611113, 54.28118],
          [10.611362, 54.280717],
          [10.61155, 54.280195],
          [10.611638, 54.279806],
          [10.611891, 54.278191],
          [10.612377, 54.275264],
          [10.612783, 54.272781],
          [10.613071, 54.271126],
          [10.613235, 54.270104],
          [10.613362, 54.269509],
          [10.613419, 54.269308],
          [10.6135, 54.269107],
          [10.613715, 54.268703],
          [10.61386, 54.26851],
          [10.61405, 54.268322],
          [10.614412, 54.267988],
          [10.614848, 54.267655],
          [10.615775, 54.26701],
          [10.61795, 54.265488],
          [10.620029, 54.263918],
          [10.622414, 54.26221],
          [10.623175, 54.261461],
          [10.625725, 54.258847],
          [10.62577, 54.2588],
          [10.629186, 54.255278],
          [10.629561, 54.254758],
          [10.629731, 54.254235],
          [10.629894, 54.253639],
          [10.630789, 54.249992],
          [10.630781, 54.249586],
          [10.630701, 54.249192],
          [10.630583, 54.24887],
          [10.630424, 54.248554],
          [10.628453, 54.245343],
          [10.627588, 54.243917],
          [10.627467, 54.24367],
          [10.627386, 54.243416],
          [10.627386, 54.243416],
          [10.627334, 54.243155],
          [10.627323, 54.242986],
          [10.627332, 54.242815],
          [10.627348, 54.242609],
          [10.627556, 54.240815],
          [10.627597, 54.240364],
          [10.627712, 54.239914],
          [10.628017, 54.238717],
          [10.628266, 54.237841],
          [10.628362, 54.237462],
          [10.628427, 54.237077],
          [10.628422, 54.236809],
          [10.628385, 54.236541],
          [10.628308, 54.236266],
          [10.628196, 54.23599],
          [10.628022, 54.235684],
          [10.627836, 54.235432],
          [10.627607, 54.23518],
          [10.62736, 54.234952],
          [10.627097, 54.234749],
          [10.62669, 54.234471],
          [10.625976, 54.234071],
          [10.624824, 54.233439],
          [10.624193, 54.233063],
          [10.623612, 54.232686],
          [10.623245, 54.232388],
          [10.622938, 54.232083],
          [10.622716, 54.231795],
          [10.622542, 54.231495],
          [10.622458, 54.231306],
          [10.62241, 54.231175],
          [10.621792, 54.228742],
          [10.621602, 54.228025],
          [10.621468, 54.227509],
          [10.621362, 54.227257],
          [10.621207, 54.227031],
          [10.621173, 54.226989],
          [10.620952, 54.226723],
          [10.620581, 54.226376],
          [10.614377, 54.221993],
          [10.614377, 54.221993],
          [10.614299, 54.221942],
          [10.61325, 54.221198],
          [10.610515, 54.219296],
          [10.609227, 54.218402],
          [10.608569, 54.217915],
          [10.60797, 54.217296],
          [10.607765, 54.216976],
          [10.607619, 54.216656],
          [10.607188, 54.215139],
          [10.606777, 54.213622],
          [10.605612, 54.209293],
          [10.605525, 54.208966],
          [10.605418, 54.208639],
          [10.605308, 54.208405],
          [10.605184, 54.208179],
          [10.605168, 54.208155],
          [10.605152, 54.208133],
          [10.604364, 54.206979],
          [10.604231, 54.206742],
          [10.604121, 54.206493],
          [10.604018, 54.2062],
          [10.603936, 54.205906],
          [10.60379, 54.205314],
          [10.603693, 54.205018],
          [10.603569, 54.204727],
          [10.603392, 54.204462],
          [10.603165, 54.204205],
          [10.602891, 54.203964],
          [10.602559, 54.203736],
          [10.602151, 54.203517],
          [10.601715, 54.203319],
          [10.600899, 54.202976],
          [10.60057, 54.202826],
          [10.600266, 54.202664],
          [10.600266, 54.202664],
          [10.600041, 54.202526],
          [10.599845, 54.202379],
          [10.599502, 54.202073],
          [10.599217, 54.201704],
          [10.598958, 54.201335],
          [10.598442, 54.200522],
          [10.597693, 54.199386],
          [10.597032, 54.198394],
          [10.597032, 54.198394],
          [10.597006, 54.198357],
          [10.596983, 54.19832],
          [10.596983, 54.19832],
          [10.596786, 54.198086],
          [10.596547, 54.197882],
          [10.595892, 54.197379],
          [10.595266, 54.1971],
          [10.594303, 54.196739],
          [10.593064, 54.196321],
          [10.592502, 54.196094],
          [10.591897, 54.195765],
          [10.591514, 54.195489],
          [10.590925, 54.194797],
          [10.590762, 54.194451],
          [10.590682, 54.19409],
          [10.590706, 54.193644],
          [10.59091, 54.193216],
          [10.59231, 54.191516],
          [10.59252, 54.191195],
          [10.592633, 54.190797],
          [10.592697, 54.190224],
          [10.592369, 54.188465],
          [10.592252, 54.188046],
          [10.592043, 54.187629],
          [10.591846, 54.187313],
          [10.59159, 54.187002],
          [10.591206, 54.18668],
          [10.590781, 54.186428],
          [10.590382, 54.186204],
          [10.590101, 54.186086],
          [10.589545, 54.1859],
          [10.587828, 54.185438],
          [10.586636, 54.185133],
          [10.585493, 54.184852],
          [10.58442, 54.184723],
          [10.583355, 54.184696],
          [10.581816, 54.184706],
          [10.577385, 54.184761],
          [10.576378, 54.184745],
          [10.57586, 54.184715],
          [10.574575, 54.184522],
          [10.570542, 54.183923],
          [10.570182, 54.183872],
          [10.567746, 54.183512],
          [10.566949, 54.183363],
          [10.566183, 54.183146],
          [10.563112, 54.182181],
          [10.561956, 54.181818],
          [10.561441, 54.181654],
          [10.560953, 54.181472],
          [10.56062, 54.181331],
          [10.560314, 54.181176],
          [10.559689, 54.180802],
          [10.559374, 54.180547],
          [10.559103, 54.180279],
          [10.558581, 54.179733],
          [10.557709, 54.178631],
          [10.557296, 54.178098],
          [10.557082, 54.177545],
          [10.557082, 54.177545],
          [10.557053, 54.177457],
          [10.557053, 54.177457],
          [10.556865, 54.176772],
          [10.556649, 54.176048],
          [10.556383, 54.175351],
          [10.556002, 54.17468],
          [10.555183, 54.173192],
          [10.554957, 54.172844],
          [10.554683, 54.172499],
          [10.554396, 54.172167],
          [10.554027, 54.171834],
          [10.552504, 54.170919],
          [10.552179, 54.170699],
          [10.551787, 54.170292],
          [10.551446, 54.169886],
          [10.551367, 54.169717],
          [10.551307, 54.169524],
          [10.551166, 54.169148],
          [10.550999, 54.168647],
          [10.550951, 54.168303],
          [10.550975, 54.168209],
          [10.551008, 54.168091],
          [10.551008, 54.168091],
          [10.551045, 54.167957],
          [10.551099, 54.167876],
          [10.551321, 54.167583],
          [10.551429, 54.167441],
          [10.55155, 54.167282],
          [10.551852, 54.167018],
          [10.552233, 54.166798],
          [10.553119, 54.16637],
          [10.554146, 54.165949],
        ],
      },
      properties: {},
    },
  ],
}
