"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CollapsibleHeroCard({
  collapseLabel,
  expandLabel,
  children,
}: {
  collapseLabel: string;
  expandLabel: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [tabTop, setTabTop] = useState<number | null>(null);
  const toggled = useRef(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const reopenRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  /** Keep the leftover edge aligned with the card's former top corner. */
  const measure = useCallback(() => {
    const card = cardRef.current;
    const hero = card?.closest(".hero") as HTMLElement | null;
    if (!card || !hero) return;
    setTabTop(Math.round(card.getBoundingClientRect().top - hero.getBoundingClientRect().top));
  }, []);

  useEffect(() => {
    if (!collapsed) return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [collapsed, measure]);

  useEffect(() => {
    if (!toggled.current) return;
    if (collapsed) reopenRef.current?.focus();
    else toggleRef.current?.focus();
  }, [collapsed]);

  function collapse() {
    toggled.current = true;
    measure();
    setCollapsed(true);
  }

  function expand() {
    toggled.current = true;
    setCollapsed(false);
  }

  return (
    <>
      <div className={`hero-card-wrap${collapsed ? " is-collapsed" : ""}`}>
        <div className="hero-card" id="hero-card" ref={cardRef} inert={collapsed} aria-hidden={collapsed}>
          <button
            ref={toggleRef}
            type="button"
            className="hero-card-toggle"
            onClick={collapse}
            aria-expanded={!collapsed}
            aria-controls="hero-card"
            aria-label={collapseLabel}
            title={collapseLabel}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          {children}
        </div>
      </div>

      {/* Outside the animated wrapper so it can anchor to the hero (screen) edge. */}
      <button
        ref={reopenRef}
        type="button"
        className={`hero-reopen${collapsed ? " is-visible" : ""}`}
        onClick={expand}
        tabIndex={collapsed ? 0 : -1}
        aria-hidden={!collapsed}
        aria-label={expandLabel}
        title={expandLabel}
        style={tabTop !== null ? { top: `${tabTop}px` } : undefined}
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </>
  );
}
