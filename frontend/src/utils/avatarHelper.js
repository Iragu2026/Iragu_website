const DEFAULT_AVATAR = "/images/avatar-image.svg";

export function isDefaultAvatar(user) {
  const raw = String(user?.avatar?.url || "").trim();
  if (!raw) return true;
  const lower = raw.toLowerCase();
  return (
    lower.includes("temp avatar") ||
    lower.includes("avatar-placeholder.svg") ||
    lower.endsWith(DEFAULT_AVATAR.toLowerCase())
  );
}

export function getAvatarUrl(user) {
  const raw = String(user?.avatar?.url || "").trim();
  if (!raw) return DEFAULT_AVATAR;

  const lower = raw.toLowerCase();
  if (
    lower.includes("temp avatar") ||
    lower.includes("avatar-placeholder.svg")
  ) {
    return DEFAULT_AVATAR;
  }

  return raw;
}

export { DEFAULT_AVATAR };
