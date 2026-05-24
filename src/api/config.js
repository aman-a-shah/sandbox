const missingValue = (name) => {
  throw new Error(`Missing required environment variable: ${name}`);
};

const readEnv = (name, { required = false, fallback = undefined } = {}) => {
  const value =
    typeof process !== "undefined" && process?.env ? process.env[name] : undefined;

  if (value === undefined || value === "") {
    if (required) {
      return missingValue(name);
    }

    return fallback;
  }

  return value;
};

const readFirstEnv = (names, { fallback = undefined } = {}) => {
  for (const name of names) {
    const value = readEnv(name);
    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return fallback;
};

const spoonacularHost = readFirstEnv(["RECIPE-API-HOST"]);

const apiConfig = {
  spoonacular: {
    apiKey: readFirstEnv(["SPOONACULAR_API_KEY", "RECIPE-API-KEY"]),
    rapidApiHost: spoonacularHost,
    baseUrl:
      readFirstEnv(["SPOONACULAR_BASE_URL"], {
        fallback: spoonacularHost
          ? `https://${spoonacularHost}`
          : "https://api.spoonacular.com",
      }),
  },
  worms: {
    baseUrl: readEnv("WORMS_BASE_URL", {
      fallback: "https://www.marinespecies.org/rest",
    }),
  },
  marlin: {
    baseUrl: readEnv("MARLIN_BASE_URL", {
      fallback: "https://api.mba.ac.uk/marlin",
    }),
  },
};

const assertApiKey = (value, label) => {
  if (!value) {
    throw new Error(`${label} API key is not configured.`);
  }
};

module.exports = {
  apiConfig,
  assertApiKey,
};
