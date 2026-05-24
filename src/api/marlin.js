const { apiConfig } = require("./config.js");
const { createUrl, requestJson, requestText } = require("./http.js");

const defaultHeaders = {
  Accept: "application/json",
};

const getSpeciesByMarlinId = async (speciesId) => {
  if (!speciesId) {
    throw new Error("getSpeciesByMarlinId requires a speciesId.");
  }

  const url = createUrl(
    apiConfig.marlin.baseUrl,
    `/species/${encodeURIComponent(speciesId)}`,
  );

  return requestJson(url, {
    headers: defaultHeaders,
  });
};

const getAllSpeciesCsv = async () => {
  const url = createUrl(apiConfig.marlin.baseUrl, "/species");

  return requestText(url, {
    headers: defaultHeaders,
  });
};

const getSpeciesByAphiaId = async (aphiaId) => {
  if (!aphiaId) {
    throw new Error("getSpeciesByAphiaId requires an aphiaId.");
  }

  const url = createUrl(
    apiConfig.marlin.baseUrl,
    `/species/${encodeURIComponent(aphiaId)}`,
    {
      type: "aphia",
    },
  );

  return requestJson(url, {
    headers: defaultHeaders,
  });
};

const searchSpeciesByName = async (name, { like = true } = {}) => {
  if (!name) {
    throw new Error("searchSpeciesByName requires a name.");
  }

  const url = createUrl(
    apiConfig.marlin.baseUrl,
    `/species/${encodeURIComponent(name)}`,
    {
      type: "name",
      like,
    },
  );

  return requestJson(url, {
    headers: defaultHeaders,
  });
};

const getSpeciesPressures = async (
  speciesId,
  { withEvidence = false } = {},
) => {
  if (!speciesId) {
    throw new Error("getSpeciesPressures requires a speciesId.");
  }

  const url = createUrl(
    apiConfig.marlin.baseUrl,
    `/speciespressures/${encodeURIComponent(speciesId)}`,
    {
      withevidence: withEvidence,
    },
  );

  return requestJson(url, {
    headers: defaultHeaders,
  });
};

const getHabitatByJnccCode = async (jnccCode) => {
  if (!jnccCode) {
    throw new Error("getHabitatByJnccCode requires a jnccCode.");
  }

  const url = createUrl(
    apiConfig.marlin.baseUrl,
    `/habitats/${encodeURIComponent(jnccCode)}`,
    {
      type: "jncc",
    },
  );

  return requestJson(url, {
    headers: defaultHeaders,
  });
};

const getAllHabitatsCsv = async () => {
  const url = createUrl(apiConfig.marlin.baseUrl, "/habitats");

  return requestText(url, {
    headers: defaultHeaders,
  });
};

module.exports = {
  getAllSpeciesCsv,
  getSpeciesByMarlinId,
  getSpeciesByAphiaId,
  searchSpeciesByName,
  getSpeciesPressures,
  getAllHabitatsCsv,
  getHabitatByJnccCode,
};
