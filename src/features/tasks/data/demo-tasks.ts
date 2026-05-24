import type { Task } from "@/types/entities";

export const buildDemoTasks = (userId: string): Task[] => {
  const now = Date.now();

  return [
    {
      id: "task_capture_system",
      userId,
      title: "Refine voice capture flow",
      description:
        "Add clearer transcript review states before saving into an idea, task, or private note.",
      status: "in_progress",
      priority: "high",
      tags: ["Voice", "UX"],
      checklist: [
        {
          id: "check_ux_warning",
          label: "Add permission explanation copy",
          completed: true,
        },
        {
          id: "check_preview",
          label: "Keep transcript editable before commit",
          completed: false,
        },
      ],
      attachments: [],
      timeline: [
        {
          id: "timeline_capture_created",
          type: "created",
          message: "Voice capture workflow added to the roadmap.",
          createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
        },
        {
          id: "timeline_capture_update",
          type: "edited",
          message: "Transcript review screen updated for faster edits.",
          createdAt: new Date(now - 1000 * 60 * 75).toISOString(),
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 75).toISOString(),
      version: 1,
      syncState: "synced",
    },
    {
      id: "task_security_keys",
      userId,
      title: "Rotate sandbox API keys",
      description:
        "Move development keys into separate vault categories and update the metadata labels for faster retrieval.",
      status: "pending",
      priority: "medium",
      tags: ["Vault", "Security"],
      checklist: [
        {
          id: "check_keys_audit",
          label: "Audit current API key usage",
          completed: false,
        },
      ],
      attachments: [],
      timeline: [
        {
          id: "timeline_keys_created",
          type: "created",
          message: "Security cleanup task added.",
          createdAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
      version: 1,
      syncState: "pending",
    },
    {
      id: "task_weekly_reset",
      userId,
      title: "Weekly review and archive",
      description:
        "Sweep completed ideas, highlight wins, and archive sensitive notes that are no longer active.",
      status: "completed",
      priority: "low",
      tags: ["Review"],
      checklist: [],
      attachments: [],
      timeline: [
        {
          id: "timeline_review_created",
          type: "created",
          message: "Weekly review generated from dashboard shortcut.",
          createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 60 * 32).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      version: 1,
      syncState: "synced",
    },
  ];
};
