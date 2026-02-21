/**
 * Returns a usable image URL for a product.
 * Falls back to a placeholder if the image is missing or is a temp placeholder.
 */
const PLACEHOLDER = "/images/new_arrival1.png";

const INVALID_URLS = ["temp url", "temp", "", undefined, null];

export function getProductImage(product) {
  // First try the flat `image` field
  if (product.image && !INVALID_URLS.includes(product.image)) {
    return product.image;
  }
  // Then try color-wise image groups
  if (Array.isArray(product.colorImages) && product.colorImages.length > 0) {
    const firstColor = product.colorImages.find(
      (entry) => Array.isArray(entry?.images) && entry.images.length > 0
    );
    const colorUrl = firstColor?.images?.[0]?.url;
    if (colorUrl && !INVALID_URLS.includes(colorUrl)) return colorUrl;
  }
  // Then try the `images` array (used by API)
  if (product.images && product.images.length > 0) {
    const url = product.images[0]?.url;
    if (url && !INVALID_URLS.includes(url)) return url;
  }
  return PLACEHOLDER;
}

export function getImageUrl(url) {
  if (url && !INVALID_URLS.includes(url)) return url;
  return PLACEHOLDER;
}
