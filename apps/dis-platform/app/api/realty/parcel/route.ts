import {NextResponse} from "next/server";
import {TRAVIS,queryPublicParcel} from "./public-parcel";
export const runtime="nodejs";
export const maxDuration=18;
export async function GET(req:Request){
 const params=new URL(req.url).searchParams;
 const lat=Number(params.get("lat")),lon=Number(params.get("lon"));
 if(!params.has("lat")||!params.has("lon")||!Number.isFinite(lat)||!Number.isFinite(lon))return NextResponse.json({error:"Valid latitude and longitude required"},{status:400});
 const data=await queryPublicParcel(lat,lon);
 return NextResponse.json({...data,provider:"Travis County public GIS",url:TRAVIS.split("/query")[0],permission:"Public map access; commercial redistribution, bulk access and ownership data are not authorized by this endpoint.",rights:"Not a legal survey or zoning decision.",lat,lon},{headers:{"cache-control":"public, max-age=120","x-content-type-options":"nosniff"}});
}
