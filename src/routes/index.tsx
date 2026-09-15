import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";

import {
  DISTRICTS,
  GENDERS,
  INTERESTS,
  PARTICIPANTS,
  VOLUNTEERS,
  districtById,
  genderLabel,
  type Gender,
  type Interest,
  type Participant,
  type TravelMode,
  type Volunteer,
} from "@/data/oslo";
import { MODES, modeLabel, suggestVolunteers, travelEstimate } from "@/lib/matching";
import type { MapVolunteer } from "@/components/MatchMap";

const MatchMap = lazy(() => import("@/components/MatchMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Frivillighetskartet — match volunteers and participants in Oslo" },
      {
        name: "description",
        content:
          "Map-based tool for Red Cross staff in Oslo: see participant areas and volunteer addresses, filter by travel time by car, public transport or bike, and confirm matches in seconds.",
      },
      {
        property: "og:title",
        content: "Frivillighetskartet — match volunteers and participants in Oslo",
      },
      {
        property: "og:description",
        content:
          "Match Red Cross volunteers with participants using travel time by car, public transport or bike on one shared map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchDesk,
});

const MAX_MINUTES_OPTIONS = [10, 15, 20, 30, 45, 60];

function Chip({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "brand" | "success" | "warning";
}) {
  const tones = {
    muted: "bg-secondary text-secondary-foreground",
    brand: "bg-brand/10 text-brand",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-foreground",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function MatchDesk() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>(VOLUNTEERS);
  const [participants, setParticipants] = useState<Participant[]>(PARTICIPANTS);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(
    PARTICIPANTS[0]?.id ?? null,
  );
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);

  const [mode, setMode] = useState<TravelMode>("transit");
  const [maxMinutes, setMaxMinutes] = useState(30);
  const [maxKm, setMaxKm] = useState(15);
  const [requireActivity, setRequireActivity] = useState(true);
  const [onlyFree, setOnlyFree] = useState(false);
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [interest, setInterest] = useState<Interest | "any">("any");
  const [gender, setGender] = useState<Gender | "any">("any");
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(90);
  const [nonSmokersOnly, setNonSmokersOnly] = useState(false);
  const [respectGenderPreference, setRespectGenderPreference] = useState(true);
  const [petFriendlyOnly, setPetFriendlyOnly] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const queue = useMemo(
    () =>
      participants
        .filter((p) => districtFilter === "all" || p.districtId === districtFilter)
        .filter((p) =>
          query.trim()
            ? `${p.name} ${p.needs.join(" ")} ${districtById(p.districtId).name}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())
            : true,
        )
        .sort(
          (a, b) =>
            Number(a.status === "matched") - Number(b.status === "matched") ||
            b.waitingSinceDays - a.waitingSinceDays,
        ),
    [participants, districtFilter, query],
  );

  const selected = participants.find((p) => p.id === selectedParticipantId) ?? null;

  const suggestions = useMemo(() => {
    if (!selected) return [];
    return suggestVolunteers(selected, volunteers, {
      mode,
      maxMinutes,
      maxKm,
      requireActivity,
      interest,
      gender,
      ageMin,
      ageMax,
      nonSmokersOnly,
      respectGenderPreference,
      petFriendlyOnly,
    }).filter((s) => (onlyFree ? s.hasCapacity : true));
  }, [
    selected,
    volunteers,
    mode,
    maxMinutes,
    maxKm,
    requireActivity,
    onlyFree,
    interest,
    gender,
    ageMin,
    ageMax,
    nonSmokersOnly,
    respectGenderPreference,
    petFriendlyOnly,
  ]);

  const mapVolunteers: MapVolunteer[] = useMemo(() => {
    const area = selected ? districtById(selected.districtId) : null;
    const inRangeIds = new Set(suggestions.map((s) => s.volunteer.id));
    return volunteers.map((volunteer) => ({
      volunteer,
      minutes: area ? travelEstimate(volunteer, area, mode).minutes : 0,
      inRange: inRangeIds.has(volunteer.id),
    }));
  }, [volunteers, suggestions, selected, mode]);

  function confirmMatch(volunteerId: string) {
    if (!selected) return;
    setVolunteers((prev) =>
      prev.map((v) => (v.id === volunteerId ? { ...v, assigned: v.assigned + 1 } : v)),
    );
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === selected.id
          ? { ...p, status: "matched", matchedVolunteerId: volunteerId }
          : p,
      ),
    );
    setSelectedVolunteerId(volunteerId);
  }

  function undoMatch(participantId: string, volunteerId?: string) {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, status: "waiting", matchedVolunteerId: undefined }
          : p,
      ),
    );
    if (volunteerId) {
      setVolunteers((prev) =>
        prev.map((v) =>
          v.id === volunteerId ? { ...v, assigned: Math.max(0, v.assigned - 1) } : v,
        ),
      );
    }
  }

  const waiting = participants.filter((p) => p.status === "waiting").length;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded bg-brand">
            <div className="relative h-4 w-4">
              <span className="absolute left-1/2 top-0 h-4 w-1.5 -translate-x-1/2 bg-brand-foreground" />
              <span className="absolute top-1/2 left-0 h-1.5 w-4 -translate-y-1/2 bg-brand-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-base leading-tight font-semibold">Frivillighetskartet</h1>
            <p className="text-xs text-muted-foreground">
              Red Cross Oslo · volunteer matching desk
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{waiting}</strong> waiting
          </span>
          <span>
            <strong className="text-foreground">{volunteers.length}</strong> volunteers
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Participant queue */}
        <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface lg:w-80 lg:border-r lg:border-b-0">
          <div className="space-y-2 border-b border-border p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search participant or need"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            />
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            >
              <option value="all">All districts</option>
              {DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {queue.map((p) => {
              const area = districtById(p.districtId);
              const active = p.id === selectedParticipantId;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setSelectedParticipantId(p.id);
                      setSelectedVolunteerId(null);
                    }}
                    className={`w-full border-b border-border px-3 py-3 text-left transition-colors ${
                      active ? "bg-accent" : "hover:bg-surface-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{p.name}</span>
                      {p.status === "matched" ? (
                        <Chip tone="success">Matched</Chip>
                      ) : (
                        <Chip tone={p.waitingSinceDays > 20 ? "warning" : "muted"}>
                          {p.waitingSinceDays} d wait
                        </Chip>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {area.name} area · {p.needs.join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.availability.join(", ")}
                    </p>
                  </button>
                </li>
              );
            })}
            {queue.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">
                No participants match this search.
              </li>
            )}
          </ul>
        </aside>

        {/* Map + filters */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-3 py-2">
            <div className="flex rounded-md border border-border p-0.5">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                    mode === m
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {modeLabel(m)}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Max travel
              <select
                value={maxMinutes}
                onChange={(e) => setMaxMinutes(Number(e.target.value))}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
              >
                {MAX_MINUTES_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Max distance
              <input
                type="range"
                min={2}
                max={40}
                value={maxKm}
                onChange={(e) => setMaxKm(Number(e.target.value))}
                className="accent-brand"
              />
              <span className="w-10 tabular-nums text-foreground">{maxKm} km</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={requireActivity}
                onChange={(e) => setRequireActivity(e.target.checked)}
                className="accent-brand"
              />
              Matching activity
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyFree}
                onChange={(e) => setOnlyFree(e.target.checked)}
                className="accent-brand"
              />
              Free capacity
            </label>
          </div>

          <div className="relative min-h-[360px] flex-1">
            <ClientOnly
              fallback={<div className="h-full w-full animate-pulse bg-surface-muted" />}
            >
              <Suspense
                fallback={<div className="h-full w-full animate-pulse bg-surface-muted" />}
              >
                <MatchMap
                  participants={participants}
                  volunteers={mapVolunteers}
                  selectedParticipantId={selectedParticipantId}
                  selectedVolunteerId={selectedVolunteerId}
                  onSelectParticipant={(id) => {
                    setSelectedParticipantId(id);
                    setSelectedVolunteerId(null);
                  }}
                  onSelectVolunteer={setSelectedVolunteerId}
                />
              </Suspense>
            </ClientOnly>

            <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-md bg-surface/95 px-3 py-2 text-[11px] leading-relaxed shadow-panel">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-brand" />
                Volunteer (exact address)
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-brand bg-brand/25" />
                Participant district area only
              </div>
            </div>
          </div>
        </main>

        {/* Suggested matches */}
        <aside className="flex w-full shrink-0 flex-col border-t border-border bg-surface lg:w-96 lg:border-t-0 lg:border-l">
          {selected ? (
            <>
              <div className="border-b border-border p-3">
                <h2 className="text-sm font-semibold">{selected.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {districtById(selected.districtId).name} area ·{" "}
                  {selected.waitingSinceDays} days waiting
                </p>
                <p className="mt-2 text-xs text-foreground">{selected.note}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selected.needs.map((n) => (
                    <Chip key={n} tone="brand">
                      {n}
                    </Chip>
                  ))}
                  {selected.languages.map((l) => (
                    <Chip key={l}>{l}</Chip>
                  ))}
                </div>
                {selected.status === "matched" && (
                  <div className="mt-3 flex items-center justify-between rounded-md bg-success/10 px-2 py-1.5 text-xs">
                    <span>
                      Matched with{" "}
                      {volunteers.find((v) => v.id === selected.matchedVolunteerId)?.name}
                    </span>
                    <button
                      onClick={() => undoMatch(selected.id, selected.matchedVolunteerId)}
                      className="font-semibold text-brand hover:underline"
                    >
                      Undo
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                <span>
                  {suggestions.length} volunteer{suggestions.length === 1 ? "" : "s"} within{" "}
                  {maxMinutes} min by {modeLabel(mode).toLowerCase()}
                </span>
              </div>

              <ul className="min-h-0 flex-1 overflow-y-auto">
                {suggestions.map((s) => {
                  const active = s.volunteer.id === selectedVolunteerId;
                  return (
                    <li key={s.volunteer.id}>
                      <div
                        onMouseEnter={() => setSelectedVolunteerId(s.volunteer.id)}
                        className={`border-b border-border px-3 py-3 transition-colors ${
                          active ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{s.volunteer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.volunteer.address}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold tabular-nums">
                              ~{s.minutes} min
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {s.km.toFixed(1)} km
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {s.activityOverlap.map((a) => (
                            <Chip key={a} tone="brand">
                              {a}
                            </Chip>
                          ))}
                          {s.availabilityOverlap.map((a) => (
                            <Chip key={a} tone="success">
                              {a}
                            </Chip>
                          ))}
                          {s.languageOverlap.map((l) => (
                            <Chip key={l}>{l}</Chip>
                          ))}
                          {!s.hasCapacity && <Chip tone="warning">At capacity</Chip>}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            Match score {s.score} · travels by{" "}
                            {s.volunteer.modes.map(modeLabel).join(", ").toLowerCase()}
                          </span>
                          <button
                            onClick={() => confirmMatch(s.volunteer.id)}
                            disabled={selected.status === "matched"}
                            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                          >
                            Confirm match
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {suggestions.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">
                    No volunteers inside these limits. Try a longer travel time, another
                    mode, or turn off the activity filter.
                  </li>
                )}
              </ul>
              <p className="border-t border-border p-3 text-[11px] text-muted-foreground">
                Travel times are estimates from distance and mode. Participant homes are
                shown as district areas only.
              </p>
            </>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              Select a participant to see suggested volunteers.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
