import https from "https";
import dns from "node:dns/promises";
import HandleError from "./handleError.js";

const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const INDIA_POST_API_HOST = "api.postalpincode.in";
const INDIA_POST_API_PATH = "/pincode/";

const SUPPORTED_INDIAN_STATES = new Set([
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
]);

const normalizePinCode = (pinCode) =>
    String(pinCode ?? "")
        .replace(/\D/g, "")
        .slice(0, 6);

const isPinMissing = (pinCode) =>
    pinCode === undefined ||
    pinCode === null ||
    String(pinCode).trim() === "";

const resolveIpv4 = async (hostname) => {
    try {
        const ips = await dns.resolve4(hostname);
        if (ips && ips.length > 0) return ips[0];
    } catch { /* fall through */ }
    return null;
};

const getJson = (pinCode) =>
    new Promise(async (resolve, reject) => {
        const ipv4 = await resolveIpv4(INDIA_POST_API_HOST);
        const requestOptions = {
            hostname: ipv4 || INDIA_POST_API_HOST,
            path: `${INDIA_POST_API_PATH}${pinCode}`,
            method: "GET",
            timeout: 8000,
            headers: { Host: INDIA_POST_API_HOST },
        };
        if (ipv4) {
            requestOptions.servername = INDIA_POST_API_HOST;
        }

        const req = https.get(requestOptions, (res) => {
            let raw = "";
            res.on("data", (chunk) => { raw += chunk; });
            res.on("end", () => {
                const statusCode = Number(res.statusCode || 0);
                if (statusCode < 200 || statusCode >= 300) {
                    return reject(new HandleError("Unable to verify PIN code right now.", 503));
                }
                try {
                    return resolve(JSON.parse(raw));
                } catch {
                    return reject(new HandleError("Unable to verify PIN code right now.", 503));
                }
            });
        });
        req.on("error", () => reject(new HandleError("Unable to verify PIN code right now.", 503)));
        req.on("timeout", () => { req.destroy(); reject(new HandleError("PIN code verification timed out.", 503)); });
    });

export const resolveIndianPinCode = async (pinCode, label = "Address") => {
    const normalizedPinCode = normalizePinCode(pinCode);
    if (!INDIAN_PINCODE_REGEX.test(normalizedPinCode)) {
        throw new HandleError(`${label} PIN code must be a valid 6-digit Indian PIN code`, 400);
    }

    const result = await getJson(normalizedPinCode);
    const firstEntry = Array.isArray(result) ? result[0] : null;

    if (
        !firstEntry ||
        firstEntry.Status !== "Success" ||
        !Array.isArray(firstEntry.PostOffice) ||
        firstEntry.PostOffice.length === 0
    ) {
        throw new HandleError(`${label} PIN code is invalid`, 400);
    }

    const office = firstEntry.PostOffice[0] || {};
    const city = office.District || office.Block || office.Name || "";
    const state = office.State || "";

    if (!city || !state) {
        throw new HandleError(`Could not resolve city/state for ${label.toLowerCase()} PIN code`, 400);
    }

    if (!SUPPORTED_INDIAN_STATES.has(state)) {
        throw new HandleError(`${label} PIN code is not supported for the selected Indian states`, 400);
    }

    return {
        pinCode: Number(normalizedPinCode),
        city,
        state,
        country: "India",
    };
};

export const validateAndNormalizeAddressFromPinCode = async (
    address = {},
    { requiredPinCode = true, label = "Address" } = {}
) => {
    const providedCountry = String(address?.country || "").trim();
    if (providedCountry && providedCountry.toLowerCase() !== "india") {
        throw new HandleError(`${label} country must be India`, 400);
    }

    if (!requiredPinCode && isPinMissing(address?.pinCode)) {
        return {
            ...address,
            country: providedCountry ? "India" : address?.country,
        };
    }

    if (isPinMissing(address?.pinCode)) {
        throw new HandleError(`${label} PIN code is required`, 400);
    }

    const resolved = await resolveIndianPinCode(address.pinCode, label);

    return {
        ...address,
        city: resolved.city,
        state: resolved.state,
        country: resolved.country,
        pinCode: resolved.pinCode,
    };
};
