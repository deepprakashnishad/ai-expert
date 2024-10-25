const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { z } = require("zod");
const { GraphState } = require("./index.js");
const { zodToJsonSchema } = require('zod-to-json-schema');
const {findZodMissingKeys} = require('./utils');

/**
 * @param {GraphState} state
 */
async function extractParameters(state) {
  const { llm, query, bestApi, params, conversation } = state;

  const messages = 
    [
      {
        "role": "system",
        "content": `Given a conversation and a list of parameters with types, extract and return parameter values as a JSON object. Omit parameters without values or mismatched types.
          Parameters: [{params}]`
      },
      {
        "role": "user",
        "content": `{query}`
      }
  ];

  if(!bestApi){
    return {
      "lastExecutedNode": "extract_params_node",
      "next_node": "human_loop_node"  
    }
  }

  var required_parameters = [];
  var optional_parameters = [];

  let requiredParams, optionalParams;

  if(bestApi.required_parameters || bestApi.optional_parameters){
    requiredParams = bestApi?.required_parameters
    .map(
      (p) => `{Name: ${p.name}, Description: ${p.description}, Type: ${p.type}}`
    )
    .join("\n");

    optionalParams = bestApi?.optional_parameters
    .map(
      (p) => `{Name: ${p.name}, Description: ${p.description}, Type: ${p.type}}`
    )
    .join("\n");
    requiredParams = requiredParams.concat(optionalParams);
    messages[0]['content'] = messages[0]['content'].replace("{params}", requiredParams)
  }else{
    requiredParams = zodToJsonSchema(bestApi.schema).properties;
    const missingKeys = findZodMissingKeys(bestApi.schema, params);
    const combinedMissingKeys = [
      ...(missingKeys.all || []),
      ...(missingKeys.atleast_2 || []),
      ...(missingKeys.atleast_1 || []),
      ...(missingKeys.atleast_3 || [])
    ];
    const filteredParams = Object.keys(requiredParams)
    .filter(key => combinedMissingKeys.includes(key))
    .reduce((obj, key) => {
      obj[key] = requiredParams[key];
      return obj;
    }, {});
    messages[0]['content'] = messages[0]['content'].replace("{params}", JSON.stringify(filteredParams))
  }
  
  messages[1]['content'] = messages[1]['content'].replace("{query}", query);

  var tempMessages = messages;
  console.log(messages)
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