const { apiConfig } = require("./config.js");
const { createUrl, requestJson } = require("./http.js");

const getAphiaIdByName = async (
  scientificName,
  { marineOnly = true, extantOnly = true } = {},
) => {
  if (!scientificName) {
    throw new Error("getAphiaIdByName requires a scientificName.");
  }

  const url = createUrl(
    apiConfig.worms.baseUrl,
    `/AphiaIDByName/${encodeURIComponent(scientificName)}`,
    {
      marine_only: marineOnly,
      extant_only: extantOnly,
    },
  );

  return requestJson(url);
};

const searchRecordsByName = async (
  scientificName,
  { like = false, marineOnly = true, extantOnly = true } = {},
) => {
  if (!scientificName) {
    throw new Error("searchRecordsByName requires a scientificName.");
  }

  const url = createUrl(
    apiConfig.worms.baseUrl,
    `/AphiaRecordsByName/${encodeURIComponent(scientificName)}`,
    {
      like,
      marine_only: marineOnly,
      extant_only: extantOnly,
    },
  );

  return requestJson(url);
};

const getAphiaRecordById = async (aphiaId) => {
  if (!aphiaId) {
    throw new Error("getAphiaRecordById requires an aphiaId.");
  }

  const url = createUrl(
    apiConfig.worms.baseUrl,
    `/AphiaRecordByAphiaID/${encodeURIComponent(aphiaId)}`,
  );

  return requestJson(url);
};

const getVernacularsByAphiaId = async (aphiaId) => {
  if (!aphiaId) {
    throw new Error("getVernacularsByAphiaId requires an aphiaId.");
  }

  const url = createUrl(
    apiConfig.worms.baseUrl,
    `/AphiaVernacularsByAphiaID/${encodeURIComponent(aphiaId)}`,
  );

  return requestJson(url);
};

const getDistributionsByAphiaId = async (aphiaId) => {
  if (!aphiaId) {
    throw new Error("getDistributionsByAphiaId requires an aphiaId.");
  }

  const url = createUrl(
    apiConfig.worms.baseUrl,
    `/AphiaDistributionsByAphiaID/${encodeURIComponent(aphiaId)}`,
  );

  return requestJson(url);
};

module.exports = {
  getAphiaIdByName,
  searchRecordsByName,
  getAphiaRecordById,
  getVernacularsByAphiaId,
  getDistributionsByAphiaId,
};
