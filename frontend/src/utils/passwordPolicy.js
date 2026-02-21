export const PASSWORD_POLICY_MESSAGE =
  "Use 8-64 characters with uppercase, lowercase, number, and special character (no spaces).";

export const isStrongPassword = (password) => {
  const value = String(password || "");
  if (value.length < 8 || value.length > 64) return false;
  if (/\s/.test(value)) return false;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};
