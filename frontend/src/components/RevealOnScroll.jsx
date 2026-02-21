import React, { useEffect, useRef, useState } from "react";

/**
 * Reveal content when it scrolls into view.
 * Starts "blank" (hidden) and fades/slides in once visible.
 */
export default function RevealOnScroll({
  children,
  className = "",
  once = true,
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
}) {
  const ref = useRef(null);
  const supportsIntersectionObserver =
    typeof window !== "undefined" && "IntersectionObserver" in window;
  const [visible, setVisible] = useState(!supportsIntersectionObserver);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!supportsIntersectionObserver) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [once, rootMargin, threshold, supportsIntersectionObserver]);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-700 ease-out will-change-transform",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

