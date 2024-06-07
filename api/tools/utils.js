/**
 * @param {string[]} requiredParams
 * @param {string[]} extractedParams
 * @returns {string[]}
 */
function findMissingParams(requiredParams, extractedParams) {
  const missing = requiredParams.filter(
    (required) => !extractedParams.some((extracted) => extracted === required)
  );
  return missing;
}

module.exports = {
  findMissingParams,
};
