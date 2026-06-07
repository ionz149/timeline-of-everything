import { useState } from "react";
import { events } from "../data/events";

interface EventSearchProps {
  onSelectEvent: (eventId: string) => void;
}

export default function EventSearch({
  onSelectEvent,
}: EventSearchProps) {
  const [searchText, setSearchText] = useState("");

  const searchResults =
    searchText.length < 2
      ? []
      : events
          .filter(event =>
            event.title
              .toLowerCase()
              .includes(searchText.toLowerCase())
          )
          .slice(0, 10);

  return (
    <div
      className="relative"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        placeholder="Search events..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-64 px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
      />

      {searchResults.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded shadow-lg">
          {searchResults.map(event => (
            <button
              key={event.id}
              className="block w-full text-left px-3 py-2 hover:bg-zinc-800 text-white"
              onClick={() => {
                onSelectEvent(event.id);
                setSearchText("");
              }}
            >
              {event.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}