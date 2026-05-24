const fs = require("fs/promises");
const path = require("path");

const {
  getAllHabitatsCsv,
  getAllSpeciesCsv,
  getAphiaRecordById,
  getVernacularsByAphiaId,
  getDistributionsByAphiaId,
} = require("../src/api");

const BIOTIC_BASE_URL = "https://api.mba.ac.uk/biotic";
const FISHBASE_SUMMARY_BASE_URL =
  "https://www.fishbase.org/summary/SpeciesSummary.php";

const KNOWN_FISH_CLASSES = new Set([
  "Actinopterygii",
  "Teleostei",
  "Osteichthyes",
  "Elasmobranchii",
  "Chondrichthyes",
  "Holocephali",
  "Sarcopterygii",
  "Myxini",
  "Hyperoartia",
  "Cephalaspidomorphi",
]);

const loadDotEnv = async () => {
  const envPath = path.resolve(__dirname, "..", ".env");

  try {
    const contents = await fs.readFile(envPath, "utf8");
    contents.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }

      row.push(cell);
      cell = "";

      if (row.some((value) => value !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value !== "")) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  return rows.slice(1).map((values) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] || "";
    });
    return entry;
  });
};

const parseTabularPayload = (text) => {
  const trimmed = (text || "").trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  return parseCsv(trimmed);
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeText = (value) => (value || "").toLowerCase();

const splitTerms = (value) =>
  normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const decodeHtmlEntities = (value) =>
  (value || "")
    .replace(/&deg;/g, " degrees")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#181;/g, "u")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const containsAny = (value, candidates) => {
  const normalized = normalizeText(value);
  return candidates.some((candidate) => {
    const pattern = new RegExp(`(^|[^a-z])${escapeRegExp(candidate)}([^a-z]|$)`, "i");
    return pattern.test(normalized);
  });
};

const mapHabitatRecord = (record) => ({
  habitatId: record.habitatID,
  habitatInformationName: record.habitatInformationName,
  jnccCode2015: record.habitatClassificationJNCC2015Code,
  jnccName2015: record.habitatClassificationJNCC2015Name,
  jnccCode2022: record.habitatClassificationJNCC2022Code,
  jnccName2022: record.habitatClassificationJNCC2022Name,
  eunisCode2008: record.habitatClassificationEUNIS2008Code,
  eunisName2008: record.habitatClassificationEUNIS2008Name,
  eunisCode2022: record.habitatClassificationEUNIS2022Code,
  eunisName2022: record.habitatClassificationEUNIS2022Name,
  reviewDate: record.habitatInformationReviewDate,
  url: record.url,
});

const inferHabitatDescriptors = (habitat) => {
  const joined = [
    habitat.habitatInformationName,
    habitat.jnccName2015,
    habitat.jnccName2022,
    habitat.eunisName2008,
    habitat.eunisName2022,
  ]
    .filter(Boolean)
    .join(" ");

  const text = normalizeText(joined);
  const substrata = [];

  if (/mud/.test(text)) substrata.push("mud");
  if (/sand/.test(text)) substrata.push("sand");
  if (/gravel/.test(text)) substrata.push("gravel");
  if (/cobble|boulder|rock|reef|bedrock|stone/.test(text)) substrata.push("rocky");
  if (/shingle|pebble/.test(text)) substrata.push("shingle/pebble");

  let depthZone = "unspecified";
  if (/littoral|intertidal/.test(text)) depthZone = "littoral/intertidal";
  if (/infralittoral/.test(text)) depthZone = "infralittoral";
  if (/circalittoral/.test(text)) depthZone = "circalittoral";
  if (/offshore|deep/.test(text)) depthZone = "offshore/deep";

  return {
    inferredDepthZone: depthZone,
    inferredSubstratum: substrata.length > 0 ? [...new Set(substrata)] : ["unspecified"],
  };
};

const enrichHabitatRecord = (record) => {
  const mapped = mapHabitatRecord(record);
  return {
    ...mapped,
    ...inferHabitatDescriptors(mapped),
  };
};

const habitatsToText = (habitats) =>
  habitats
    .map((habitat, index) =>
      [
        `${index + 1}. ${habitat.habitatInformationName}`,
        `Habitat ID: ${habitat.habitatId}`,
        `JNCC 2015: ${habitat.jnccCode2015} - ${habitat.jnccName2015}`,
        `JNCC 2022: ${habitat.jnccCode2022} - ${habitat.jnccName2022}`,
        `EUNIS 2008: ${habitat.eunisCode2008} - ${habitat.eunisName2008}`,
        `EUNIS 2022: ${habitat.eunisCode2022} - ${habitat.eunisName2022}`,
        `Depth zone: ${habitat.inferredDepthZone}`,
        `Substratum: ${habitat.inferredSubstratum.join(", ")}`,
        `URL: ${habitat.url}`,
        "",
      ].join("\n"),
    )
    .join("\n");

const habitatSearchFields = (record) =>
  [
    record.habitatID,
    record.habitatInformationName,
    record.habitatClassificationJNCC2015Code,
    record.habitatClassificationJNCC2015Name,
    record.habitatClassificationJNCC2022Code,
    record.habitatClassificationJNCC2022Name,
    record.habitatClassificationEUNIS2008Code,
    record.habitatClassificationEUNIS2008Name,
    record.habitatClassificationEUNIS2022Code,
    record.habitatClassificationEUNIS2022Name,
  ]
    .filter(Boolean)
    .map(normalizeText);

const resolveHabitat = (habitats, query) => {
  const normalizedQuery = normalizeText(query).trim();
  if (!normalizedQuery) {
    throw new Error("Please provide a habitat query.");
  }

  let match = habitats.find((record) =>
    habitatSearchFields(record).some((field) => field === normalizedQuery),
  );
  if (match) {
    return match;
  }

  match = habitats.find((record) =>
    habitatSearchFields(record).some((field) => field.includes(normalizedQuery)),
  );
  if (match) {
    return match;
  }

  const queryTerms = splitTerms(normalizedQuery);
  const ranked = habitats
    .map((record) => {
      const fields = habitatSearchFields(record).join(" ");
      const tokenHits = queryTerms.filter((term) => containsAny(fields, [term])).length;
      return { record, tokenHits };
    })
    .filter((entry) => entry.tokenHits > 0)
    .sort((a, b) => b.tokenHits - a.tokenHits);

  if (ranked.length > 0) {
    return ranked[0].record;
  }

  throw new Error(`No habitat found for query "${query}".`);
};

const fetchBioticCsv = async () => {
  const response = await fetch(BIOTIC_BASE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch BIOTIC data: ${response.status}`);
  }
  return response.text();
};

const isFish = (record) => {
  if (normalizeText(record.Phylum) !== "chordata") {
    return false;
  }

  return KNOWN_FISH_CLASSES.has(record.Class);
};

const buildHabitatProfile = (habitat) => {
  const joined = [
    habitat.habitatInformationName,
    habitat.habitatClassificationJNCC2015Name,
    habitat.habitatClassificationJNCC2022Name,
    habitat.habitatClassificationEUNIS2008Name,
    habitat.habitatClassificationEUNIS2022Name,
  ]
    .filter(Boolean)
    .join(" ");

  const text = normalizeText(joined);
  const required = [];

  const pushIf = (condition, trait, values, weight) => {
    if (condition) {
      required.push({ trait, values, weight });
    }
  };

  pushIf(/mud/.test(text), "substratum", ["mud", "muddy", "silt", "clay"], 24);
  pushIf(/sand/.test(text), "substratum", ["sand", "sandy"], 24);
  pushIf(/gravel/.test(text), "substratum", ["gravel"], 20);
  pushIf(/shingle|pebble|cobble/.test(text), "substratum", ["shingle", "pebble", "cobble"], 20);
  pushIf(/boulder|rock|reef|stone|bedrock/.test(text), "substratum", ["boulder", "rock", "reef", "bedrock", "cobble"], 24);
  pushIf(/littoral|intertidal/.test(text), "biozone", ["littoral"], 18);
  pushIf(/infralittoral/.test(text), "biozone", ["infralittoral"], 18);
  pushIf(/circalittoral|offshore/.test(text), "biozone", ["circalittoral", "offshore"], 18);
  pushIf(/estuar|lagoon|brackish/.test(text), "salinity", ["variable", "reduced", "brackish"], 18);
  pushIf(/sheltered/.test(text), "waveexp", ["sheltered"], 12);
  pushIf(/exposed/.test(text), "waveexp", ["exposed"], 12);
  pushIf(/strong/.test(text), "waterflow", ["strong"], 10);
  pushIf(/weak|still/.test(text), "waterflow", ["weak"], 10);

  return {
    terms: splitTerms(joined),
    requiredTraits: required,
  };
};

const habitatAccessibilityWeight = (habitat) => {
  let weight = 1;

  if (habitat.inferredDepthZone === "littoral/intertidal") weight += 0.2;
  if (habitat.inferredDepthZone === "infralittoral") weight += 0.1;
  if (habitat.inferredDepthZone === "offshore/deep") weight -= 0.15;
  if (habitat.inferredSubstratum.includes("rocky")) weight -= 0.05;

  return Math.max(0.5, Math.min(1.3, weight));
};

const buildStringSignals = (record) =>
  [
    record.Habit,
    record.DepthRange,
    record.biozone,
    record.envpos,
    record.physpref,
    record.salinity,
    record.substratum,
    record.waterflow,
    record.waveexp,
  ]
    .filter(Boolean)
    .join(" | ");

const scoreFishForHabitat = (habitatProfile, record) => {
  let score = 10;

  habitatProfile.requiredTraits.forEach(({ trait, values, weight }) => {
    if (containsAny(record[trait], values)) {
      score += weight;
    }
  });

  const signalText = buildStringSignals(record);
  const matchingTerms = [...new Set(habitatProfile.terms)].filter((term) =>
    containsAny(signalText, [term]),
  );

  if (matchingTerms.length > 0) {
    score += Math.min(20, matchingTerms.length * 4);
  }

  return Math.max(0, Math.min(100, score));
};

const fetchFishBaseSummary = async (scientificName) => {
  const [genusname, speciesname] = scientificName.split(" ");
  if (!genusname || !speciesname) {
    return null;
  }

  const url = `${FISHBASE_SUMMARY_BASE_URL}?genusname=${encodeURIComponent(
    genusname,
  )}&speciesname=${encodeURIComponent(speciesname)}`;

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  if (!html.includes("Environment: milieu / climate zone / depth range / distribution range")) {
    return null;
  }

  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const environmentMatch = html.match(
    /Environment: milieu \/ climate zone \/ depth range \/ distribution range[\s\S]*?<div class="smallSpace">\s*<span>\s*([\s\S]*?)<\/span>/i,
  );
  const sizeMatch = html.match(
    /Length at first maturity \/ Size \/ Weight \/ Age[\s\S]*?<div class="smallSpace">\s*<span>\s*([\s\S]*?)<\/span>/i,
  );
  const ecologyMatch = html.match(/Occurs on ([\s\S]*?)<\/span>/i);

  const environmentText = decodeHtmlEntities(environmentMatch?.[1] || "");
  const sizeText = decodeHtmlEntities(sizeMatch?.[1] || "");
  const ecologyText = decodeHtmlEntities(ecologyMatch?.[1] || "");
  const titleText = decodeHtmlEntities(titleMatch?.[1] || "");

  const maxLengthMatch = sizeText.match(/Max length\s*:?\s*([0-9.]+)\s*cm/i);
  const commonLengthMatch = sizeText.match(/common length\s*:\s*([0-9.]+)\s*cm/i);
  const depthMatch = environmentText.match(/depth range\s*([0-9.]+)\s*-\s*([0-9.]+)\s*m/i);
  const usualDepthMatch = environmentText.match(/usually\s*([0-9.]+)\s*-\s*([0-9.]+)\s*m/i);

  return {
    summaryUrl: url,
    environmentText,
    ecologyText,
    commonLengthCm: commonLengthMatch ? Number(commonLengthMatch[1]) : null,
    averageDepthMeters: usualDepthMatch
      ? Number(
          ((Number(usualDepthMatch[1]) + Number(usualDepthMatch[2])) / 2).toFixed(2),
        )
      : depthMatch
        ? Number(
            ((Number(depthMatch[1]) + Number(depthMatch[2])) / 2).toFixed(2),
          )
        : null,
    maxLengthCm: maxLengthMatch ? Number(maxLengthMatch[1]) : null,
    depthMinM: depthMatch ? Number(depthMatch[1]) : null,
    fisheryTags:
      titleText
        .split(":")[1]
        ?.split(",")
        .map((part) => part.trim())
        .filter(Boolean) || [],
  };
};

const pickCommonName = (vernaculars, fallback) => {
  const english = vernaculars.find((entry) =>
    /english/i.test(entry.language || entry.lang || ""),
  );

  return (
    english?.vernacular ||
    english?.vernacularName ||
    fallback ||
    "Unknown common name"
  );
};

const summarizeDistributions = (distributions) =>
  distributions
    .map((entry) => entry.location || entry.locality || entry.area || entry.notes || null)
    .filter(Boolean)
    .slice(0, 3);

const enrichFish = async (record, marlinSpeciesByName) => {
  const scientificName = record.SpeciesName;
  const marlinSpecies = marlinSpeciesByName.get(normalizeText(scientificName)) || null;
  const aphiaId = marlinSpecies?.aphiaID || null;
  const fishBase = await fetchFishBaseSummary(scientificName).catch(() => null);

  let wormsRecord = null;
  let vernaculars = [];
  let distributions = [];

  if (aphiaId) {
    wormsRecord = await getAphiaRecordById(aphiaId).catch(() => null);
    vernaculars = await getVernacularsByAphiaId(aphiaId).catch(() => []);
    distributions = await getDistributionsByAphiaId(aphiaId).catch(() => []);
  }

  return {
    commonName: pickCommonName(vernaculars, marlinSpecies?.synonymCommonName),
    scientificName,
    family: wormsRecord?.family || record.Family || "Unknown family",
    order: wormsRecord?.order || record.Ordr || "Unknown order",
    aphiaId,
    marlinSpeciesId: marlinSpecies?.speciesID || null,
    marlinUrl: marlinSpecies?.url || null,
    fishBaseSummaryUrl: fishBase?.summaryUrl || null,
    fishBaseEnvironment: fishBase?.environmentText || null,
    fishBaseEcology: fishBase?.ecologyText || null,
    sizeCategory: record.Size || null,
    averageDepthMeters: fishBase?.averageDepthMeters || null,
    fishBaseCommonLengthCm: fishBase?.commonLengthCm || null,
    wormsDistributionCount: distributions.length,
    wormsDistributionSummary: summarizeDistributions(distributions),
    _scoring: {
      fishBaseDepthMinM: fishBase?.depthMinM || null,
      fishBaseMaxLengthCm: fishBase?.maxLengthCm || null,
      fishBaseFisheryTags: fishBase?.fisheryTags || [],
      substratum: record.substratum || null,
      environmentalPosition: record.envpos || null,
      mobility: record.mobility || null,
      habit: record.Habit || null,
    },
  };
};

const assignPercentagesFromWeights = (items, weights, fieldName) => {
  const sanitizedWeights = weights.map((weight) => Math.max(0, Number(weight) || 0));
  const total = sanitizedWeights.reduce((sum, weight) => sum + weight, 0);

  if (total <= 0) {
    items.forEach((item) => {
      item[fieldName] = 0;
    });
    return;
  }

  const rawBasisPoints = sanitizedWeights.map((weight) => (weight / total) * 10000);
  const flooredBasisPoints = rawBasisPoints.map((value) => Math.floor(value));
  let remainder = 10000 - flooredBasisPoints.reduce((sum, value) => sum + value, 0);

  const rankedRemainders = rawBasisPoints
    .map((value, index) => ({
      index,
      fractional: value - flooredBasisPoints[index],
    }))
    .sort((left, right) => right.fractional - left.fractional);

  for (let index = 0; index < rankedRemainders.length && remainder > 0; index += 1) {
    flooredBasisPoints[rankedRemainders[index].index] += 1;
    remainder -= 1;
  }

  items.forEach((item, index) => {
    item[fieldName] = Number((flooredBasisPoints[index] / 100).toFixed(2));
  });
};

const normalizePercentages = (items, scoreAccessor, fieldName) => {
  assignPercentagesFromWeights(
    items,
    items.map((item) => scoreAccessor(item)),
    fieldName,
  );
};

const normalizeLikelyCatchPercentages = (items, habitat) => {
  if (items.length === 0) {
    return;
  }

  const ranked = items.map((item, index) => ({
    index,
    item,
    rawScore: Math.max(0.25, scoreLikelyCatch(item, habitat)),
  }));

  ranked.sort((left, right) => right.rawScore - left.rawScore);

  let weights = ranked.map((entry, rankIndex) => {
    const rankRatio = ranked.length <= 1 ? 0 : rankIndex / (ranked.length - 1);
    const dominanceMultiplier = 2.8 - rankRatio * 2.4;
    return Math.pow(entry.rawScore, 1.4) * dominanceMultiplier;
  });

  const getSpread = (candidateWeights) => {
    const total = candidateWeights.reduce((sum, weight) => sum + weight, 0);
    return candidateWeights.map((weight) => (weight / total) * 100);
  };

  let spread = getSpread(weights);
  let maxPercent = Math.max(...spread);
  let minPercent = Math.min(...spread);
  let iterations = 0;

  while (items.length > 1 && (maxPercent < 18 || minPercent > 4) && iterations < 5) {
    weights = weights.map((weight, index) => {
      const rankRatio = ranked.length <= 1 ? 0 : index / (ranked.length - 1);
      const tailTaper = 1.18 - rankRatio * 0.5;
      return Math.pow(weight, 1.22) * tailTaper;
    });
    spread = getSpread(weights);
    maxPercent = Math.max(...spread);
    minPercent = Math.min(...spread);
    iterations += 1;
  }

  const finalWeights = Array.from({ length: items.length }, () => 0);
  ranked.forEach((entry, rankIndex) => {
    finalWeights[entry.index] = weights[rankIndex];
  });

  assignPercentagesFromWeights(items, finalWeights, "likelyCatchPercent");
};

const scoreObservedRecords = (fish) => {
  const recordWeight = Math.max(1, fish.wormsDistributionCount || 0);
  const depthWeight = fish._scoring.fishBaseDepthMinM !== null ? 1.15 : 1;
  return fish.habitatFitPercent * Math.log2(recordWeight + 1) * depthWeight;
};

const scoreFishingActivityAssociation = (fish, habitat) => {
  let speciesWeight = fish.habitatFitPercent;
  const env = normalizeText(fish._scoring.environmentalPosition);
  const mobility = normalizeText(fish._scoring.mobility);
  const habit = normalizeText(fish._scoring.habit);
  const fishBaseEnv = normalizeText(fish.fishBaseEnvironment);
  const fisheryTags = fish._scoring.fishBaseFisheryTags.map(normalizeText);

  if (env.includes("demersal")) speciesWeight += 10;
  if (env.includes("pelagic")) speciesWeight += 6;
  if (mobility.includes("swimmer")) speciesWeight += 8;
  if (habit.includes("free living")) speciesWeight += 5;
  if (fishBaseEnv.includes("demersal")) speciesWeight += 8;
  if (fishBaseEnv.includes("pelagic")) speciesWeight += 5;
  if (fisheryTags.includes("fisheries")) speciesWeight += 12;
  if ((fish._scoring.fishBaseMaxLengthCm || 0) >= 20) speciesWeight += 6;

  return speciesWeight * habitatAccessibilityWeight(habitat);
};

const scoreLikelyCatch = (fish, habitat) => {
  let score = fish.habitatFitPercent;
  const depthZone = habitat.inferredDepthZone;
  const env = normalizeText(fish.fishBaseEnvironment);
  const ecology = normalizeText(fish.fishBaseEcology);

  if (depthZone === "littoral/intertidal" && ((fish._scoring.fishBaseDepthMinM || 999) <= 5)) {
    score += 10;
  }
  if (depthZone === "circalittoral" && env.includes("demersal")) {
    score += 8;
  }
  if (
    habitat.inferredSubstratum.some(
      (item) =>
        containsAny(ecology, [item]) || containsAny(fish._scoring.substratum, [item]),
    )
  ) {
    score += 10;
  }
  if ((fish.fishBaseCommonLengthCm || 0) > 0) {
    score += Math.min(10, fish.fishBaseCommonLengthCm / 3);
  } else if ((fish._scoring.fishBaseMaxLengthCm || 0) > 0) {
    score += Math.min(8, fish._scoring.fishBaseMaxLengthCm / 6);
  }
  if (fish._scoring.fishBaseFisheryTags.map(normalizeText).includes("fisheries")) {
    score += 8;
  }

  return score;
};

const stripScoringFields = (fish) => {
  const { _scoring, ...publicFish } = fish;
  return publicFish;
};

const fetchHabitatCatalog = async () => {
  const habitats = parseTabularPayload(await getAllHabitatsCsv());
  return habitats.map(enrichHabitatRecord);
};

const buildFishForHabitat = async (habitatQuery) => {
  const [habitatsRaw, marlinSpeciesRaw, bioticRaw] = await Promise.all([
    getAllHabitatsCsv(),
    getAllSpeciesCsv(),
    fetchBioticCsv(),
  ]);

  const habitats = parseTabularPayload(habitatsRaw);
  const habitatRecord = resolveHabitat(habitats, habitatQuery);
  const habitat = enrichHabitatRecord(habitatRecord);
  const habitatProfile = buildHabitatProfile(habitatRecord);
  const marlinSpecies = parseTabularPayload(marlinSpeciesRaw);
  const marlinSpeciesByName = new Map(
    marlinSpecies.map((entry) => [normalizeText(entry.taxonomyName), entry]),
  );

  const fishRecords = parseTabularPayload(bioticRaw).filter(isFish);
  const scored = fishRecords
    .map((record) => ({
      record,
      habitatFitPercent: scoreFishForHabitat(habitatProfile, record),
    }))
    .filter((entry) => entry.habitatFitPercent > 15)
    .sort((a, b) => b.habitatFitPercent - a.habitatFitPercent)
    .slice(0, 40);

  const fish = [];
  for (const entry of scored) {
    const enriched = await enrichFish(entry.record, marlinSpeciesByName);
    fish.push({
      ...enriched,
      habitatFitPercent: entry.habitatFitPercent,
    });
  }

  normalizeLikelyCatchPercentages(fish, habitat);
  normalizePercentages(fish, scoreObservedRecords, "observedSpeciesRecordPercent");
  normalizePercentages(
    fish,
    (item) => scoreFishingActivityAssociation(item, habitat),
    "fishingActivityAssociatedPercent",
  );

  return {
    habitat,
    notes: {
      likelyCatchPercent:
        "Contrast-amplified normalized proxy based on MarLIN habitat fit plus FishBase depth, habitat text, size, and fishery-use cues across the returned fish set. Values are widened so each habitat has clearer common and legendary catches and still sum to 100%.",
      observedSpeciesRecordPercent:
        "Normalized proxy based on habitat fit weighted by WoRMS distribution record counts, with a small FishBase depth-data bonus when available.",
      fishingActivityAssociatedPercent:
        "Normalized proxy based on habitat fit, FishBase fishery-use and environment cues, fish mobility/environment traits, and habitat accessibility. This is not a direct Global Fishing Watch species measurement.",
      sourceApis: ["MarLIN", "WoRMS", "MBA BIOTIC", "FishBase"],
    },
    fishCount: fish.length,
    fish: fish.map(stripScoringFields),
  };
};

module.exports = {
  buildFishForHabitat,
  enrichHabitatRecord,
  fetchHabitatCatalog,
  habitatsToText,
  loadDotEnv,
  slugify,
};
