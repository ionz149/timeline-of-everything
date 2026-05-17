import { events } from "../data/events";
import { yearToX } from "../utils/timelineScale";

// const WIDTH = 12000;
const WIDTH = 2000;
const HEIGHT = 500;

export default function Timeline() {
  return (
    <div className="w-full h-full overflow-x-scroll overflow-y-hidden">

      <svg
        width={WIDTH}
        height={HEIGHT}
        className="bg-zinc-900"
      >

        {/* main axis */}
        <line
          x1={0}
          y1={100}
          x2={WIDTH}
          y2={100}
          stroke="#666"
        />

        {/* events */}
        {events.map((event, index) => {

          const x = yearToX(
            event.startYear,
            WIDTH
          );

          const endX = yearToX(
            event.endYear,
            WIDTH
          );

          const eventWidth = endX - x;

          return (
            <g
              key={event.id}
              transform={`translate(${x}, ${
                140 + index * 60
              })`}
            >

              <rect
                width={eventWidth}
                height={24}
                rx={4}
                fill="#3b82f6"
              />

              <text
                x={10}
                y={16}
                fill="white"
                fontSize="12"
              >
                {event.title}
              </text>

            </g>
          );
        })}
      </svg>
    </div>
  );
}