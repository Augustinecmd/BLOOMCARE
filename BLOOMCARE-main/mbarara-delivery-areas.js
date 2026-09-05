// BloomCare Pharmacy - Mbarara City Centralized Delivery Areas Registry
// Physical Hub: Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda

export const BLOOMCARE_CENTRAL_LOCATION = {
  pharmacyName: "BloomCare Pharmacy Main Dispensary",
  city: "Mbarara City",
  district: "Mbarara",
  country: "Uganda",
  physicalAddress: "Plot 18, High Street / Hospital Road Junction, Mbarara City",
  landmarks: {
    hospital: "Near Mbarara Regional Referral Hospital",
    station: "Opposite Rubis Station",
    police: "Near Mbarara Central Police Station"
  },
  referenceDescription: "Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City",
  dispatchPolicyNotice: "BloomCare delivers within Mbarara City and surrounding service areas."
};

export const MBARARA_DIVISIONS = [
  "Kamukuzi",
  "Kakoba",
  "Nyamitanga",
  "Kakiika",
  "Biharwe",
  "Nyakayojo"
];

export const MBARARA_DELIVERY_AREAS = {
  Kamukuzi: [
    "Kamukuzi Central",
    "Kiyanja",
    "Kisenyi",
    "Kiswahili",
    "Biafura",
    "Kashanyarazi",
    "Kizungu",
    "Booma",
    "Ruharo",
    "Other"
  ],
  Kakoba: [
    "Kakoba Central",
    "Alliance",
    "Nyamityobora",
    "Buremba",
    "Kakyeka",
    "Lugazi",
    "Katete Road",
    "Other"
  ],
  Nyamitanga: [
    "Nyamitanga Central",
    "Katete",
    "Katete Central",
    "Rwebikoona",
    "Karugangama",
    "Agip",
    "Other"
  ],
  Kakiika: [
    "Kakiika Central",
    "Rwebishuri",
    "Makenke",
    "Surveyor",
    "Kenkombe",
    "Mile 2",
    "Other"
  ],
  Biharwe: [
    "Biharwe Central",
    "Nyabuhama",
    "Rwenjeru",
    "Kakigani",
    "Mile 6",
    "Other"
  ],
  Nyakayojo: [
    "Nyakayojo Central",
    "Rucece",
    "Katojo",
    "Rwemigina",
    "Kibingo",
    "Other"
  ]
};

export function getMbararaDivisions() {
  return [...MBARARA_DIVISIONS];
}

export function getMbararaAreas(division) {
  if (!division) return [];
  const normalized = Object.keys(MBARARA_DELIVERY_AREAS).find(
    d => d.toLowerCase() === String(division).trim().toLowerCase()
  );
  return normalized ? [...MBARARA_DELIVERY_AREAS[normalized]] : [];
}

export function isValidMbararaDivision(division) {
  if (!division) return false;
  return MBARARA_DIVISIONS.some(
    d => d.toLowerCase() === String(division).trim().toLowerCase()
  );
}

export function isValidMbararaArea(division, area) {
  if (!division || !area) return false;
  const areas = getMbararaAreas(division);
  if (!areas || areas.length === 0) return false;
  return areas.some(a => a.toLowerCase() === String(area).trim().toLowerCase());
}

export function searchMbararaLocations(query = "") {
  const cleanQuery = String(query).trim().toLowerCase();
  if (!cleanQuery) {
    const all = [];
    for (const div of MBARARA_DIVISIONS) {
      for (const area of MBARARA_DELIVERY_AREAS[div]) {
        if (area !== "Other") {
          all.push({ division: div, area, label: `${area}, ${div}` });
        }
      }
    }
    return all;
  }

  const matches = [];
  for (const div of MBARARA_DIVISIONS) {
    const divMatch = div.toLowerCase().includes(cleanQuery);
    for (const area of MBARARA_DELIVERY_AREAS[div]) {
      if (area === "Other") continue;
      const areaMatch = area.toLowerCase().includes(cleanQuery);
      if (divMatch || areaMatch) {
        matches.push({
          division: div,
          area,
          label: `${area}, ${div}`
        });
      }
    }
  }
  return matches;
}

export function formatDeliveryAddress(addressObj) {
  if (!addressObj) return "";
  if (typeof addressObj === "string") return addressObj;

  const division = addressObj.deliveryDivision || addressObj.division || "";
  const area = addressObj.deliveryArea || addressObj.area || "";
  const customArea = addressObj.customArea || "";
  const effectiveArea = area === "Other" && customArea ? customArea : area;
  const specificLocation = addressObj.specificLocation || addressObj.location || addressObj.address || "";
  const landmark = addressObj.landmark || "";
  const city = addressObj.city || "Mbarara City";

  const parts = [];
  if (effectiveArea) parts.push(effectiveArea);
  if (division) parts.push(division);
  if (city) parts.push(city);

  let formatted = parts.join(", ");
  const details = [];
  if (specificLocation) details.push(specificLocation);
  if (landmark && landmark !== specificLocation) details.push(`Near ${landmark}`);

  if (details.length > 0) {
    formatted = `${formatted} (${details.join(" • ")})`;
  }

  return formatted || "Mbarara City";
}

export function validateMbararaDeliveryAddress(addressObj = {}) {
  const errors = [];
  const division = (addressObj.deliveryDivision || addressObj.division || "").trim();
  const area = (addressObj.deliveryArea || addressObj.area || "").trim();
  const customArea = (addressObj.customArea || "").trim();
  const specificLocation = (addressObj.specificLocation || addressObj.location || addressObj.address || "").trim();

  if (!division) {
    errors.push("Please select your Mbarara City delivery division.");
  } else if (!isValidMbararaDivision(division)) {
    errors.push(`"${division}" is not a recognized Mbarara City division.`);
  }

  if (!area) {
    errors.push("Please select your delivery area or neighborhood.");
  } else if (!isValidMbararaArea(division, area)) {
    errors.push(`"${area}" is not in the ${division} division area list.`);
  } else if (area === "Other" && (!customArea || customArea.length < 2)) {
    errors.push("Please specify your area or neighborhood name.");
  }

  if (!specificLocation || specificLocation.length < 2) {
    errors.push("Please provide a specific location or landmark (e.g. building name, house number, nearby shop or road).");
  }

  return {
    valid: errors.length === 0,
    errors,
    error: errors[0] || null
  };
}
