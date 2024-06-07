const fs = require("fs");
const { StructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { GraphState } = require("./index.js");
const { HIGH_LEVEL_CATEGORY_MAPPING, TRIMMED_CORPUS_PATH } = require("./constants.js");
const { DatasetSchema } = require("./types.js");

/**
 * Given a users query, extract the high level category which
 * best represents the query.
 */
class ExtractHighLevelCategories extends StructuredTool {
  constructor() {
    super();
    this.schema = z.object({
      highLevelCategories: z
        .array(
          z
            .enum(Object.keys(HIGH_LEVEL_CATEGORY_MAPPING))
            .describe("An enum of all categories which best match the query.")
        )
        .describe("The high level categories to extract from the query."),
    });
    this.name = "ExtractHighLevelCategories";
    this.description =
      "Given a user query, extract the high level category which best represents the query.";
  }

  async _call(input) {
    const categoriesMapped = input.highLevelCategories
      .map(
        (category) =>
          HIGH_LEVEL_CATEGORY_MAPPING[category]
      )
      .flat();
    return JSON.stringify(categoriesMapped);
  }
}

/**
 * @param {GraphState} state
 */
async function extractCategory(state) {
  const { llm, query } = state;

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an expert software engineer.

      Currently, you are helping a fellow engineer select the best category of APIs based on their query.
      You are only presented with a list of high level API categories, and their query.
      Think slowly, and carefully select the best category for the query.
      Here are all the high level categories, and every tool name that falls under them:
      {categoriesAndTools}`,
    ],
    ["human", `Query: {query}`],
  ]);

  const tool = new ExtractHighLevelCategories();
  const modelWithTools = llm.withStructuredOutput(tool);
  const chain = prompt.pipe(modelWithTools).pipe(tool);

  const allApis = JSON.parse(fs.readFileSync(TRIMMED_CORPUS_PATH, "utf-8"));
  const categoriesAndTools = Object.entries(HIGH_LEVEL_CATEGORY_MAPPING)
    .map(([high, low]) => {
      const allTools = allApis.filter((api) => low.includes(api.category_name));
      return `High Level Category: ${high}\nTools:\n${allTools
        .map((item) => `Name: ${item.tool_name}`)
        .join("\n")}`;
    })
    .join("\n\n");

  const response = await chain.invoke({
    query,
    categoriesAndTools,
  });
  const highLevelCategories = JSON.parse(response);

  return {
    categories: highLevelCategories,
    lastExecutedNode: "extract_category_node"
  };
}

module.exports = {
  ExtractHighLevelCategories, extractCategory
}