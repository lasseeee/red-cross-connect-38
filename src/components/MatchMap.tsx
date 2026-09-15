import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { districtById, type Participant, type Volunteer } from "@/data/oslo";

export type MapVolunteer = {
  volunteer: Volunteer;
  minutes: number;
  inRange: boolean;
};

type Props = {
  participants: Participant[];
  volunteers: MapVolunteer[];
  selectedParticipantId: string | null;
  selectedVolunteerId: string | null;
  onSelectParticipant: (id: string) => void;
  onSelectVolunteer: (id: string) => void;
};

function pinIcon(label: string, classes: string, size = 30) {
  return L.divIcon({
    className: "",
    html: `<div class="rk-pin ${classes}" style="width:${size}px;height:${size}px">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 12, { duration: 0.7 });
  }, [center, map]);
  return null;
}

export default function MatchMap({
  participants,
  volunteers,
  selectedParticipantId,
  selectedVolunteerId,
  onSelectParticipant,
  onSelectVolunteer,
}: Props) {
  const selected = participants.find((p) => p.id === selectedParticipantId) ?? null;
  const selectedArea = selected ? districtById(selected.districtId) : null;

  const center = useMemo<[number, number] | null>(
    () => (selectedArea ? [selectedArea.lat, selectedArea.lng] : null),
    [selectedArea],
  );

  return (
    <MapContainer
      center={[59.921, 10.79]}
      zoom={11}
      className="h-full w-full"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      <FlyTo center={center} />

      {participants.map((p) => {
        const area = districtById(p.districtId);
        const isSelected = p.id === selectedParticipantId;
        return (
          <Circle
            key={p.id}
            center={[area.lat, area.lng]}
            radius={area.radius}
            pathOptions={{
              color: isSelected ? "oklch(0.53 0.22 26.5)" : "oklch(0.45 0.03 250)",
              weight: isSelected ? 2 : 1,
              fillColor: isSelected ? "oklch(0.53 0.22 26.5)" : "oklch(0.45 0.03 250)",
              fillOpacity: isSelected ? 0.22 : 0.09,
            }}
            eventHandlers={{ click: () => onSelectParticipant(p.id) }}
          >
            <Tooltip direction="top">
              <span className="font-medium">{p.name}</span> · {area.name} area
            </Tooltip>
          </Circle>
        );
      })}

      {selectedArea &&
        volunteers
          .filter((v) => v.inRange)
          .map((v) => (
            <Polyline
              key={`line-${v.volunteer.id}`}
              positions={[
                [v.volunteer.lat, v.volunteer.lng],
                [selectedArea.lat, selectedArea.lng],
              ]}
              pathOptions={{
                color: "oklch(0.53 0.22 26.5)",
                weight: v.volunteer.id === selectedVolunteerId ? 3 : 1,
                opacity: v.volunteer.id === selectedVolunteerId ? 0.8 : 0.25,
                dashArray: "4 6",
              }}
            />
          ))}

      {volunteers.map(({ volunteer, minutes, inRange }) => (
        <Marker
          key={volunteer.id}
          position={[volunteer.lat, volunteer.lng]}
          icon={pinIcon(
            selectedArea && inRange ? `${minutes}` : "",
            [
              inRange ? "rk-pin-volunteer" : "rk-pin-volunteer-dim",
              volunteer.id === selectedVolunteerId ? "rk-pin-selected" : "",
            ].join(" "),
            selectedArea && inRange ? 32 : 18,
          )}
          eventHandlers={{ click: () => onSelectVolunteer(volunteer.id) }}
        >
          <Tooltip direction="top">
            <span className="font-medium">{volunteer.name}</span>
            <br />
            {volunteer.address}
            {selectedArea && inRange ? <> · ~{minutes} min</> : null}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
