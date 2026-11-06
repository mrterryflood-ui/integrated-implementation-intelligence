import "leaflet/dist/leaflet.css";
import ExposomeAtlas from "./exposome-atlas";
export const metadata={title:"DIS · Environmental and cancer research atlas",description:"Source-attributed county cancer context and EPA facility layer. Proximity does not prove exposure or cancer causation."};
export default function Page(){return <ExposomeAtlas/>;}
