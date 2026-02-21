import HandleError from "./handleError.js";

const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

export const PASSWORD_POLICY_MESSAGE =
    "Password must be 8-64 characters and include uppercase, lowercase, number, and special character.";

export const validatePasswordStrength = (password) => {
    const value = String(password || "");

    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
        return false;
    }
    if (/\s/.test(value)) {
        return false;
    }

    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);

    return hasUpper && hasLower && hasDigit && hasSpecial;
};

export const assertStrongPassword = (password, label = "Password") => {
    if (!validatePasswordStrength(password)) {
        throw new HandleError(
            `${label} is too weak. ${PASSWORD_POLICY_MESSAGE}`,
            400
        );
    }
};

