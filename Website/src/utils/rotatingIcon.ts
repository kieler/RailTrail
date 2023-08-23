
import L from "leaflet"

/**
 * A Vehicle Icon with a rotating background layer and a foreground layer that does not rotate.
 */
export default class RotatingVehicleIcon extends L.DivIcon {

    private readonly baseElement: HTMLDivElement;
    private readonly baseLayer: HTMLImageElement;
    private readonly rotatingLayer: HTMLImageElement;
    private readonly foregroundLayer: HTMLImageElement;

    /**
     * @param baseElement      The div-element to use as a base for the construction
     * @param baseLayerUrl     The url of the background shown when rotation is unknown
     * @param rotatingLayerUrl The url of the background shown when the rotation is known.
     * @param foregroundUrl    The url of the non-rotating foreground image.
     */
    public constructor(baseElement: HTMLDivElement, baseLayerUrl: string = '/vehicle/Vehicle_background_neutral.svg', rotatingLayerUrl: string = '/vehicle/Vehicle_background_heading.svg', foregroundUrl: string = '/vehicle/Vehicle_foreground.svg') {
        super({html: baseElement, className: 'rotatingIconContainerContainer', iconSize: [45, 45]})
        this.baseElement = baseElement
        this.baseElement.className = 'rotatingIconContainer'
        // construct the background layers
        this.baseLayer = document.createElement('img');
        this.baseLayer.src = baseLayerUrl;
        this.baseLayer.className = 'rotatingIcon';
        this.rotatingLayer = document.createElement('img');
        this.rotatingLayer.src = rotatingLayerUrl;
        this.rotatingLayer.className = 'rotatingIcon';

        // and the foreground layer
        this.foregroundLayer = document.createElement('img');
        this.foregroundLayer.src = foregroundUrl;
        this.foregroundLayer.className = 'rotatingIcon';

        // then stack them all into the base element
        this.baseElement.append(this.baseLayer, this.rotatingLayer, this.foregroundLayer)
    }

    /**
     * Sets the rotation of the background layer
     * @param degrees The target rotation for the icon.
     */
    public setRotation(degrees: number | undefined) {
        if (degrees !== undefined) {
            this.rotatingLayer.style.rotate = `${degrees}deg`;
            this.baseLayer.style.display = 'none'
            this.rotatingLayer.style.display = '';
        } else {
            this.baseLayer.style.display = ''
            this.rotatingLayer.style.display = 'none'
        }
    }
}