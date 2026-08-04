import "server-only";

import { all, get } from "@/lib/db/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { Notification, NotificationChannel, Paginated } from "@/lib/types";

interface NotificationRow {
  id: string;
  created_at: string;
  recipient: string;
  channel: NotificationChannel;
  message: string;
  request_id: string | null;
  reference_number: string | null;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    timestamp: row.created_at,
    recipient: row.recipient,
    channel: row.channel,
    message: row.message,
    relatedRequestId: row.request_id,
    relatedReferenceNumber: row.reference_number,
  };
}

export interface NotificationQuery {
  channel?: string;
  q?: string;
  requestId?: string;
  page?: number;
  pageSize?: number;
}

export function listNotifications(query: NotificationQuery = {}): Paginated<Notification> {
  const conditions: string[] = [];
  const params: Record<string, string | number> = {};

  if (query.channel) {
    conditions.push("n.channel = :channel");
    params.channel = query.channel;
  }
  if (query.requestId) {
    conditions.push("n.request_id = :requestId");
    params.requestId = query.requestId;
  }
  if (query.q) {
    conditions.push("(n.recipient LIKE :q OR n.message LIKE :q)");
    params.q = `%${query.q}%`;
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total =
    get<{ count: number }>(`SELECT COUNT(*) AS count FROM notifications n ${where}`, params)
      ?.count ?? 0;
  const pageSize = Math.min(Math.max(query.pageSize ?? DEFAULT_PAGE_SIZE, 1), 200);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);

  const items = all<NotificationRow>(
    `SELECT n.*, r.reference_number
       FROM notifications n
       LEFT JOIN requests r ON r.id = n.request_id
       ${where}
      ORDER BY n.created_at DESC
      LIMIT :limit OFFSET :offset`,
    { ...params, limit: pageSize, offset: (page - 1) * pageSize }
  ).map(toNotification);

  return { items, total, page, pageSize, pageCount };
}

export function notificationChannelCounts(): Record<string, number> {
  const rows = all<{ channel: string; count: number }>(
    "SELECT channel, COUNT(*) AS count FROM notifications GROUP BY channel"
  );
  return Object.fromEntries(rows.map((row) => [row.channel, row.count]));
}
