export type JobStatus =
  | "completed"
  | "failed"
  | "active"
  | "delayed"
  | "prioritized"
  | "waiting"
  | "waiting-children"
  | "unknown";
