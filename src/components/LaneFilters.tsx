import { lanes } from "../config/lanes";

interface LaneFiltersProps {
  visibleLanes: string[];
  setVisibleLanes: React.Dispatch<
    React.SetStateAction<string[]>
  >;
}

export default function LaneFilters({
  visibleLanes,
  setVisibleLanes,
}: LaneFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {lanes.map(lane => {
        const active = visibleLanes.includes(lane.id);
        const Icon = lane.icon;

        return (
          <button
            key={lane.id}
            onClick={() => {
              setVisibleLanes(prev =>
                prev.includes(lane.id)
                  ? prev.filter(id => id !== lane.id)
                  : [...prev, lane.id]
              );
            }}
            className={`flex flex-row items-center gap-2 px-2 py-1 rounded text-sm border ${
              active
                ? "bg-zinc-700 text-white"
                : "bg-zinc-900 text-zinc-500"
            }`}
          >
            <Icon
              size={20}
              color={active ? "white" : "#71717A"}
              strokeWidth={2}
            />

            {lane.label}
          </button>
        );
      })}
    </div>
  );
}