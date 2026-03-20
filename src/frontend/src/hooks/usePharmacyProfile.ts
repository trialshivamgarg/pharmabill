const STORAGE_KEY = "pharmacyProfile";

export interface PharmacyProfile {
  name: string;
  address1: string;
  address2: string;
  phone: string;
  email: string;
  gstin: string;
  dlNo1: string;
  dlNo2: string;
}

const DEFAULT_PROFILE: PharmacyProfile = {
  name: "AMBICURE HEALTHCARE AND PHARMACY",
  address1: "F 13 Street No 6, Brahampuri, Moni Baba Mandir Road",
  address2: "Delhi 110053",
  phone: "9953774706",
  email: "AMBICUREHEALTHCARE@GMAIL.COM",
  gstin: "07BXUPG3995C1Z1",
  dlNo1: "RLF20DL2025001813",
  dlNo2: "1805",
};

export function getPharmacyProfile(): PharmacyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PROFILE;
}

export function savePharmacyProfile(profile: PharmacyProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
