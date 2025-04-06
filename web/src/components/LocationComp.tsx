import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import { Location } from "../types";

interface LocationCompProps {
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly location: Location;
}

interface LocationCompState {}

export default class LocationComp extends Component<LocationCompProps, LocationCompState> {
    constructor(props: LocationCompProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        const { location } = this.props;
        const { name, latitude, longitude } = location;
        return (
            <div
                style={{ ...this.props.style }}
                className={`LocationComp ${this.props.className ?? ""} flex flex-col pt-2 underline`}
            >
                <a href={`geo:${latitude},${longitude}`}>
                    {latitude}, {longitude}
                </a>

                <a
                    rel="no-referrer"
                    target="_blank"
                    href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
                >
                    OpenStreetMap
                </a>

                <a
                    rel="no-referrer"
                    target="_blank"
                    href={`https://www.google.com/maps/place/${latitude},${longitude}`}
                >
                    Google Maps
                </a>

                <a
                    rel="no-referrer"
                    target="_blank"
                    href={`https://www.bing.com/maps?q=${latitude},${longitude}`}
                >
                    Bing Maps
                </a>
            </div>
        );
    };
}
