/**
 * @typedef {Object} DatasetParameters
 * @property {string} name
 * @property {string} type
 * @property {string} description
 * @property {string} default
 */

/**
 * @typedef {Object} DatasetSchema
 * @property {string} id
 * @property {string} category_name
 * @property {string} tool_name
 * @property {string} api_name
 * @property {string} api_description
 * @property {DatasetParameters[]} required_parameters
 * @property {DatasetParameters[]} optional_parameters
 * @property {string} method
 * @property {Object.<string, any>} template_response
 * @property {string} api_url
 */

module.exports = {
  /**
   * @type {DatasetParameters}
   */
  DatasetParameters: {},

  /**
   * @type {DatasetSchema}
   */
  DatasetSchema: {}
};
