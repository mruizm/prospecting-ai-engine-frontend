import type { AnalysisEvent } from "../lib/types";

export function Timeline({ events }: { events: AnalysisEvent[] }) {
  if (events.length === 0) {
    return <div className="state-block">No events yet.</div>;
  }
  return (
    <div className="timeline">
      {events.map((event) => (
        <div className="tl-item" key={event.id}>
          <div className="tl-rail">
            <div className={`tl-dot ${event.level}`} />
          </div>
          <div className="tl-body">
            <div className="tl-top">
              <span className="tl-msg">{event.message}</span>
              <span className="tl-time mono">{formatTime(event.created_at)}</span>
            </div>
            <div className="tl-stage">
              {event.stage}
              {event.capability_id ? ` · ${event.capability_id}` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
