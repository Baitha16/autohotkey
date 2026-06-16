const VIP = /^VIP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const TRIAL = /^TRIAL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const WL = /^WL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const ML = /^ML-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const LT = /^LT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const EZ = /^EZ-\d{9,15}(-[A-Z0-9]{4}-[A-Z0-9]{4})?$/;

export function isValidLicenseCode(code) {
  return VIP.test(code) || TRIAL.test(code) || WL.test(code) || ML.test(code) || LT.test(code) || EZ.test(code);
}

export function isValidPhone(phone) {
  return /^\d{9,15}$/.test(phone);
}

export function isValidMembershipType(type) {
  return ["monthly", "weekly", "trial", "lifetime"].includes(type);
}

export function isValidDuration(days) {
  return Number.isInteger(days) && days >= 1 && days <= 3650;
}
