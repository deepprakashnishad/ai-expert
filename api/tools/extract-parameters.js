const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { z } = require("zod");
const { GraphState } = require("./index.js");


/**
 * @param {GraphState} state
 */
async function extractParameters(state) {
  const { llm, query, bestApi, params, conversation } = state;

  /*const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an expert software engineer. You're provided with a list of required and optional parameters for an API, along with a user's query.

Given the query and the parameters, use the 'extract_params' tool to extract the parameters from the query.

If the query does not contain any of the parameters, do not return params.

Required parameters: {requiredParams}

Optional parameters: {optionalParams}`,
    ],
    ["human", `Query: {query}`],
  ]);*/

  const messages = 
    [
      {
        "role": "system",
        "content": `You are an expert software engineer. You are provided with list of parameters whose values need to be extracted from the conversation provided between user and assistant. 
        Your task is to extract values of the parameters from the conversation provided. Also ensure that value matches the type of the parameter provided. In case you do NOT find value for a parameter then skip it and do not include in your result untill a default value is provided in the parameter list. Return an empty object if values for none of the parameters are found. Also DO  NOT INSERT parameters on your own and do not introduce any values of parameters on your own. Response must be in json format.
            Parameters: [{params}]`
      },
      {
        "role": "user",
        "content": `{query}`
      }
  ];



  const requiredParams = bestApi?.required_parameters
    .map(
      (p) => `{Name: ${p.name}, Description: ${p.description}, Type: ${p.type}}`
    )
    .join("\n");
  const optionalParams = bestApi?.optional_parameters
    .map(
      (p) => `{Name: ${p.name}, Description: ${p.description}, Type: ${p.type}}`
    )
    .join("\n");

    messages[0]['content'] = messages[0]['content'].replace("{params}", requiredParams.concat(optionalParams))
    messages[1]['content'] = messages[1]['content'].replace("{query}", query);

    var tempMessages = messages;

    if(conversation){
      tempMessages = messages.concat(conversation)
    }
    
    console.log(tempMessages);
    var response = await sails.helpers.callChatGpt.with({"messages": tempMessages, "max_tokens": 4096});
    var res_params = JSON.parse(response[0]['message']['content']);

    console.log(res_params);
    return {
      params: {
        ...params,
        ...res_params
      },
      "lastExecutedNode": "extract_params_node"
    };
}

module.exports = {
  extractParameters
}