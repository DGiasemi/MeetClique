const WATER_COLOR = "#00BFFF";
const LAND_COLOR = "#f5f5f5";

const FOCUS_ZOOM = 0.005;
const UNFOCUS_ZOOM = 0.015;

const FOCUS_ANIMATION_DURATION = 1000;
const UNFOCUS_ANIMATION_DURATION = 700;

const customMapStyle = [
    {
        featureType: "poi.business",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
    },
    {
        featureType: "poi.place_of_worship",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
    },
    {
        featureType: "poi.school",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
    },
    {
        featureType: "poi.sports_complex",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
    },
    // {
    //     featureType: "water",
    //     elementType: "geometry",
    //     stylers: [{ color: WATER_COLOR }],
    // },
    // {
    //     featureType: "landscape",
    //     elementType: "geometry",
    //     stylers: [{ color: LAND_COLOR }],
    // },
    
];

export {
    customMapStyle,
    WATER_COLOR,
    LAND_COLOR,
    FOCUS_ZOOM,
    UNFOCUS_ZOOM,
    FOCUS_ANIMATION_DURATION,
    UNFOCUS_ANIMATION_DURATION,
}