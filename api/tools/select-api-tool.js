const { StructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

class SelectAPITool extends StructuredTool {
  constructor(apis, query) {
    super();
    this.name = "Select_API";
    this.description = SelectAPITool.createDescription(apis, query);
    this.apis = apis;
    this.schema = z.object({
      api: z.enum(apis.map((api) => api.api_name))
        .describe("The name of the API which best matches the query."),
    });
  }

  static createDescription(apis, query) {
    const description = `Given the following query by a user, select the API which will best serve the query.

    Query: ${query}

    APIs:
    ${apis
      .map(
    (api) => `Tool name: ${api.name}
      API Name: ${api.api_name}
      Description: ${api.description}
      Parameters: ${[...api.required_parameters, ...api.optional_parameters]
      .map((p) => `Name: ${p.name}, Description: ${p.description}`)
      .join("\n")}`
    )
    .join("\n---\n")}`;
    return description;
  }

  async _call(input) {
    const { api: apiName } = input;
    const bestApi = this.apis.find((a) => a.api_name === apiName);
    if (!bestApi) {
      throw new Error(
        `API ${apiName} not found in list of APIs: ${this.apis
          .map((a) => a.api_name)
          .join(", ")}`
      );
    }
    return JSON.stringify(bestApi);
  }
}

/**
 * @typedef {import("index.js").GraphState} GraphState
 */

/**
 * @param {GraphState} state
 */
async function selectApi(state) {
  const { llm, query, apis } = state;
  if (apis === null || apis.length === 0) {
    throw new Error("No APIs passed to select_api_node");
  }

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an expert software engineer, helping a junior engineer select the best API for their query.
Given their query, use the 'Select_API' tool to select the best API for the query.`,
    ],
    ["human", `Query: ${query}`],
  ]);

  const tool = new SelectAPITool(apis, query);

  const modelWithTools = llm.withStructuredOutput(tool);

  const chain = prompt.pipe(modelWithTools).pipe(tool);

  const response = await chain.invoke({
    query,
  });
  const bestApi = JSON.parse(response);
  console.log(bestApi)
  return {
    bestApi,
    "lastExecutedNode": "select_api_node"
  };
}

module.exports = {
  selectApi,
};
