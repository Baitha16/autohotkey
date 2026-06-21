const WL_CODE = /^WL-(?:[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}|\d{9,15})$/;
const ML_CODE = /^ML-(?:[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}|\d{9,15})$/;
const YL_CODE = /^YL-(?:[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}|\d{9,15})$/;
const LT_CODE = /^LT-(?:[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}|\d{9,15})$/;
const VIP = /^VIP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const TRIAL = /^TRIAL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const EZ = /^EZ-\d{9,15}(-[A-Z0-9]{4}-[A-Z0-9]{4})?$/;

export function isValidLicenseCode(code) {
  return VIP.test(code) || TRIAL.test(code) || WL_CODE.test(code) || ML_CODE.test(code) || YL_CODE.test(code) || LT_CODE.test(code) || EZ.test(code);
}

export function isValidPhone(phone) {
  return /^\d{9,15}$/.test(phone);
}

export function isValidMembershipType(type) {
  return ["monthly", "weekly", "yearly", "trial", "lifetime"].includes(type);
}

export function isValidDuration(days) {
  return Number.isInteger(days) && days >= 1 && days <= 3650;
}
