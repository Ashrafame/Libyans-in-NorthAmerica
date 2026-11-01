"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { createEventAction } from "@/lib/actions/admin";
import { AField, ATextarea } from "@/components/admin/ui";

export function EventForm() {
  const [tickerEn, setTickerEn] = useState("");
  const [tickerAr, setTickerAr] = useState("");
  const [bg, setBg] = useState("#0b4f6c");
  const [color, setColor] = useState("#ffffff");

  return (
    <div className="admin-grid admin-grid-2" style={{ alignItems: "start" }}>
      <form action={createEventAction}>
        <div className="admin-grid admin-grid-2">
          <AField label="Event title (English)" name="titleEn" required />
          <AField label="Event title (Arabic)" name="titleAr" required />
          <ATextarea label="Details (English)" name="bodyEn" rows={3} />
          <ATextarea label="Details (Arabic)" name="bodyAr" rows={3} />
          <AField label="Optional image URL" name="imageUrl" span />
          <AField label="Days to feature on the home page" name="announceDays" type="number" defaultValue={7} />
          <AField label="Days to show the ticker" name="tickerDays" type="number" defaultValue={21} />
          <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#cfdae3" }}>
              <input type="checkbox" name="tickerEnabled" defaultChecked />
              Show a scrolling notice after the featured period
            </label>
          </div>
          <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="tickerTextEn">Ticker text (English)</label>
            <input
              id="tickerTextEn"
              name="tickerTextEn"
              className="admin-input"
              value={tickerEn}
              onChange={(event) => setTickerEn(event.target.value)}
              placeholder="Defaults to the event title if left empty."
            />
          </div>
          <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="tickerTextAr">Ticker text (Arabic)</label>
            <input
              id="tickerTextAr"
              name="tickerTextAr"
              className="admin-input"
              value={tickerAr}
              onChange={(event) => setTickerAr(event.target.value)}
              dir="rtl"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="tickerBgColor">Ticker background</label>
            <div className="admin-color-row">
              <input
                id="tickerBgColor"
                name="tickerBgColor"
                type="color"
                value={bg}
                onChange={(event) => setBg(event.target.value)}
              />
              <input className="admin-input" value={bg} readOnly dir="ltr" style={{ fontFamily: "monospace" }} />
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="tickerTextColor">Ticker text colour</label>
            <div className="admin-color-row">
              <input
                id="tickerTextColor"
                name="tickerTextColor"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
              <input className="admin-input" value={color} readOnly dir="ltr" style={{ fontFamily: "monospace" }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="admin-btn admin-btn-primary">
            <Megaphone size={14} /> Create and schedule
          </button>
        </div>
      </form>

      <div>
        <div className="admin-note" style={{ marginBottom: 8 }}>
          Ticker preview
        </div>
        <div
          className="ticker"
          style={{ background: bg, color, borderRadius: 8, overflow: "hidden", border: "1px solid #26323c" }}
        >
          <span className="ticker-label" style={{ fontSize: 10 }}>
            <Megaphone size={11} /> Notice
          </span>
          <div className="ticker-viewport">
            <div className="ticker-track" style={{ animationDuration: "16s" }}>
              {[0, 1].map((copy) => (
                <div key={copy} className="row" style={{ gap: 48 }} aria-hidden={copy === 1}>
                  <span className="ticker-item" style={{ fontSize: 12 }}>
                    {tickerEn || "Your notice will scroll across the home page"}
                  </span>
                  <span className="ticker-item" style={{ fontSize: 12 }} dir="rtl">
                    {tickerAr || "سيظهر تنبيهك هنا باللغة العربية"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="admin-note" style={{ marginTop: 10 }}>
          On the Arabic site the notice travels from left to right; on the English site from right to left. The
          animation pauses when a visitor hovers over it.
        </p>

        <div
          style={{
            marginTop: 18,
            border: "1px dashed #26323c",
            borderRadius: 8,
            padding: 14,
            fontSize: 12.5,
            color: "#9fb2c0",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: "#cfdae3" }}>How display works</strong>
          <br />
          The event appears as a card on the home page for the featured days. After that, the scrolling notice runs
          for its own number of days. After both windows end, it disappears from the site but is never deleted from
          the database.
        </div>
      </div>
    </div>
  );
}
