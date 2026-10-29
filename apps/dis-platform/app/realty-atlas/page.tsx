import "leaflet/dist/leaflet.css";
import "./atlas.css";
import RealtyAtlasClient from "./atlas-client";
export const metadata={title:"DIS Realty Atlas — Regional GIS Evidence Sandbox",description:"Official USGS aerial imagery and limited public GIS reference data, labeled by provenance and verification state."};
export default function RealtyAtlasPage(){return <RealtyAtlasClient/>}
