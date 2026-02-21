import { useEffect } from "react";

const BASE_TITLE = "Iragu For Her";

/**
 * Sets the browser tab title.
 * @param {string} title — page-specific title (e.g. "Home", "About Us", product name)
 *   Pass an empty string or nothing to show only the base title.
 */
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;

    // Reset to base title when the component unmounts
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
