import type { Priority } from "../lib/types";

export function PriorityTag({ priority }: { priority: Priority }) {
  return <span className={`priority-tag priority-${priority}`}>{priority}</span>;
}
