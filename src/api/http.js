const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const createUrl = (baseUrl, path, params) =>
  `${baseUrl}${path}${buildQueryString(params)}`;

const requestText = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Request failed (${response.status} ${response.statusText}) for ${url}: ${body}`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  return response.text();
};

const requestJson = async (url, options = {}) => {
  const text = await requestText(url, {
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  return JSON.parse(text);
};

module.exports = {
  createUrl,
  requestText,
  requestJson,
};
