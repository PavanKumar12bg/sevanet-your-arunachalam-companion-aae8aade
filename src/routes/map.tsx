import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "మ్యాప్ — సేవనెట్" }] }),
  ssr: false,
  component: MapPage,
});

const TEMPLE = { lat: 12.2253, lng: 79.0747, name: "శ్రీ అరుణాచలేశ్వర ఆలయం" };

function MapPage() {
  const [Map, setMap] = useState<any>(null);
  const [pins, setPins] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      const rl = await import("react-leaflet");
      // fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      setMap(() => rl);
    })();
    supabase.from("listings").select("id,title,slug,latitude,longitude,category_id,categories(name_te)").eq("status", "published").not("latitude", "is", null).then(({ data }) => setPins(data ?? []));
  }, []);

  if (!Map) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">మ్యాప్ లోడ్ అవుతోంది...</div>;

  const { MapContainer, TileLayer, Marker, Popup } = Map;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-display text-3xl text-gradient-gold">అరుణాచల మ్యాప్</h1>
      <p className="text-sm text-muted-foreground mt-1">ఆలయం, హోటల్స్, రెస్టారెంట్లు, దవాఖానాలు</p>
      <div className="mt-4 h-[70vh] rounded-2xl overflow-hidden border border-border shadow-elegant">
        <MapContainer center={[TEMPLE.lat, TEMPLE.lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[TEMPLE.lat, TEMPLE.lng]}>
            <Popup><b>{TEMPLE.name}</b></Popup>
          </Marker>
          {pins.map((p) => (
            <Marker key={p.id} position={[p.latitude, p.longitude]}>
              <Popup>
                <b>{p.title}</b><br />
                <span style={{ fontSize: 11 }}>{p.categories?.name_te}</span><br />
                <a href={`/listing/${p.slug}`}>చూడండి →</a>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
