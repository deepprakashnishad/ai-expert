const fetch = require("node-fetch"); // Assuming you are using node-fetch for making fetch requests

/**
 * @typedef {import("./index").GraphState} GraphState
 */

/**
 * @param {GraphState} state
 * @returns {Promise<Partial<GraphState>>}
 */
async function createFetchRequest(state) {
  const { params, bestApi } = state;
  if (!bestApi) {
    throw new Error("No best API found");
  }

  let response = null;
  try {
    console.log(bestApi.api_url);
    if (!params) {
      console.log("Making request WITHOUT params");
      const fetchRes = await fetch(bestApi.api_url, {
        method: bestApi.method,
      });
      response = fetchRes.ok ? await fetchRes.json() : await fetchRes.text();
    } else {
      console.log("Making request with params");
      console.log("Params");
      console.log(params);

      let fetchOptions = {
        method: bestApi.method,
      };
      let parsedUrl = bestApi.api_url;

      const paramKeys = Object.entries(params);
      paramKeys.forEach(([key, value]) => {
        if (parsedUrl.includes(`{${key}}`)) {
          parsedUrl = parsedUrl.replace(`{${key}}`, value);
          delete params[key];
        }
      });

      const url = new URL(parsedUrl);

      if (["GET", "HEAD"].includes(bestApi.method)) {
        Object.entries(params).forEach(([key, value]) =>
          url.searchParams.append(key, value)
        );
      } else {
        fetchOptions = {
          ...fetchOptions,
          body: JSON.stringify(params),
          headers: {
            "Content-Type": "application/json",
          },
        };
      }

      const fetchRes = await fetch(url, fetchOptions);
      response = fetchRes.ok ? await fetchRes.json() : await fetchRes.text();
    }
    console.log(response);

    if (response) {
      return {
        response,
        "lastExecutedNode": "execute_request_node"
      };
    }
  } catch (e) {
    console.error("Error fetching API");
    console.error(e);
  }

  return {
    response: null,
    "lastExecutedNode": "execute_request_node"
  };
}

module.exports = {
  createFetchRequest,
};
