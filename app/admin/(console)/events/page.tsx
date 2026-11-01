import { CalendarRange, Trash2 } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canWrite, canRead } from "@/lib/rbac";
import { listEvents } from "@/lib/repo";
import { formatDate, daysLeft } from "@/lib/format";
import { deleteEventAction } from "@/lib/actions/admin";
import { AdminHead, AdminNotice, AdminPanel, AdminEmpty, StatusBadge } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/event-form";
import { ConfirmButton } from "@/components/admin/confirm-button";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  if (!canRead(admin.role, "events")) {
    return (
      <AdminNotice tone="error">Your role does not have access to this section.</AdminNotice>
    );
  }

  const query = await searchParams;
  const saved = Boolean(query.saved);
  const deleted = Boolean(query.deleted);
  const error = query.error === "required";
  const canEdit = canWrite(admin.role, "events");

  const events = await listEvents(true);
  const live = events.filter((event) => !event.deletedAt);
  const removed = events.filter((event) => event.deletedAt);
  const now = Date.now();

  return (
    <>
      <AdminHead
        title="Community events"
        sub="Create a featured announcement, then a scrolling notice that remains after the feature ends."
      />

      {saved && <AdminNotice tone="ok">Event created and scheduled.</AdminNotice>}
      {deleted && <AdminNotice tone="ok">Event deleted. The deletion was recorded in the audit log.</AdminNotice>}
      {error && <AdminNotice tone="error">Title in both languages is required.</AdminNotice>}

      {canEdit ? (
        <AdminPanel title="New event" style={{ marginBottom: 20 }}>
          <EventForm />
        </AdminPanel>
      ) : (
        <AdminNotice tone="info">Your role has read-only access to events.</AdminNotice>
      )}

      <AdminPanel title={`Scheduled events (${live.length})`}>
        {live.length === 0 ? (
          <AdminEmpty>No events have been created yet.</AdminEmpty>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Featured until</th>
                <th>Ticker</th>
                <th style={{ textAlign: "end" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {live.map((event) => {
                const featuredNow = new Date(event.announceUntil).getTime() > now;
                const tickerNow = event.tickerEnabled && new Date(event.tickerUntil).getTime() > now;
                return (
                  <tr key={event.id}>
                    <td style={{ maxWidth: 380 }}>
                      <div style={{ fontWeight: 500 }}>{event.titleEn}</div>
                      <div style={{ color: "#6b7f8e", fontSize: 11.5, marginTop: 2 }} dir="rtl">
                        {event.titleAr}
                      </div>
                      <div style={{ color: "#6b7f8e", fontSize: 11, marginTop: 4 }}>by {event.createdBy}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>{formatDate(event.announceUntil, "en")}</div>
                      <div style={{ marginTop: 5 }}>
                        {featuredNow ? (
                          <StatusBadge tone="green">{daysLeft(event.announceUntil)}d featured</StatusBadge>
                        ) : (
                          <StatusBadge>Ended</StatusBadge>
                        )}
                      </div>
                    </td>
                    <td>
                      {event.tickerEnabled ? (
                        <>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: event.tickerBgColor,
                              color: event.tickerTextColor,
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              maxWidth: 220,
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {event.tickerTextEn}
                          </div>
                          <div style={{ marginTop: 5 }}>
                            {tickerNow ? (
                              <StatusBadge tone="blue">
                                {daysLeft(event.tickerUntil)}d left
                              </StatusBadge>
                            ) : (
                              <StatusBadge>Finished</StatusBadge>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="admin-note">Off</span>
                      )}
                    </td>
                    <td style={{ textAlign: "end" }}>
                      {canEdit && (
                        <form action={deleteEventAction}>
                          <input type="hidden" name="id" value={event.id} />
                          <ConfirmButton message="Delete this event? It will be removed from the site immediately.">
                            <Trash2 size={12} /> Delete
                          </ConfirmButton>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AdminPanel>

      {removed.length > 0 && (
        <AdminPanel title={`Deleted events (${removed.length})`} style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Deleted by</th>
                <th>Deleted at</th>
              </tr>
            </thead>
            <tbody>
              {removed.map((event) => (
                <tr key={event.id}>
                  <td>
                    <div style={{ fontSize: 12.5 }}>{event.titleEn}</div>
                    <div style={{ color: "#6b7f8e", fontSize: 11, marginTop: 2 }}>{event.titleAr}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{event.deletedBy ?? "—"}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(event.deletedAt, "en")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="admin-note" style={{ marginTop: 10 }}>
            <CalendarRange size={12} style={{ display: "inline", marginInlineEnd: 4 }} />
            Deleted events are kept in the database for the audit trail and are not shown to visitors.
          </p>
        </AdminPanel>
      )}
    </>
  );
}
