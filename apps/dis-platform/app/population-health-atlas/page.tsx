import "leaflet/dist/leaflet.css";
import "./atlas.css";
import PopulationHealthAtlas from "./atlas-client";
export const metadata={title:"DIS Population Health & Prevention Atlas",description:"Large-cohort cancer surveillance comparison, prevention counterfactuals, and source-labeled EPA ECHO environment map context."};
export default function PopulationHealthAtlasPage(){return <PopulationHealthAtlas/>;}
