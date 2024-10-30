const readline = require("readline");
const { findMissingParams } = require("./utils");

/**
 * @typedef {import("./index").GraphState} GraphState
 * @typedef {import("./types").DatasetParameters} DatasetParameters
 */

const paramsFormat = `<name>,<value>:::<name>,<value>`;

/**
 * Read the user input from the command line
 * TODO: implement & add args
 * @param {DatasetParameters[]} missingParams
 * @returns {Promise<string>}
 */
function readUserInput(missingParams) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });  

  const missingParamsString = missingParams
    .map((p) => `Name: ${p.name}, Description: ${p.description}`)
    .join("\n----\n");
  const question = `LangTool couldn't find all the required params for the API.\nMissing params:\n${missingParamsString}\nPlease provide the missing params in the following format:\n${paramsFormat}\n`;

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Parse the user input string into a key-value pair
 * TODO: implement
 * @param {string} input
 * @returns {Record<string, string>}
 */
function parseUserInput(input) {
  if (!input.includes(":::")) {
    const [key, value] = input.split(",");
    return { [key]: value };
  }

  const splitParams = input.split(":::");
  let params = {};
  splitParams.forEach((param) => {
    const [key, value] = param.split(",");
    params[key] = value;
  });
  return params;
}

/**
 * @param {GraphState} state
 * @returns {Promise<Partial<GraphState>>}
 */
async function requestParameters(state) {
  const { llm, bestApi, params, chatId, conversation, query } = state;
  if (!bestApi) {
    throw new Error("No best API found");
  }
  const requiredParamsKeys = bestApi.required_parameters.map(
    ({ name }) => name
  );
  const extractedParamsKeys = Object.keys(params ?? {});
  const missingParams = findMissingParams(
    requiredParamsKeys,
    extractedParamsKeys
  );
  const missingParamsSchemas = missingParams
    .map((missingParamKey) =>
      bestApi.required_parameters.find(({ name }) => name === missingParamKey)
    )
    .filter((p) => p !== undefined);

  const missingParamsString = missingParamsSchemas
    .map((p) => `{Name: ${p.name}, Description: ${p.description}}`)
    .join("\n----\n");

  var messages = 
    [
      {
        "role": "system",
        "content": `You are an expert customer representative who rephrases provided list of missing information into user-friendly questions in order to reply user query. You may collect less information so that user is not stressed by seeing many questions at a time. Your reply must be in form of json format with serial number as keys. You should STRICTLY limit your questions to collect missing_info provided by the user and DO NOT add questions on your own.
          `
      },{
        "role": "user",
        "content": `query: {query}, missing_info: [{params}]`
      }
  ];

  messages[1]['content'] = messages[1]['content'].replace("{params}", missingParamsString).replace("{query}", query);

  var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
  var res_params = JSON.parse(response[0]['message']['content']);

  var question = "";
  Object.keys(res_params).forEach(key => {
    question = `${question}${res_params[key]}\n`;
  })
  // const question = `LangTool couldn't find all the required params for the API.\nMissing params:\n${missingParamsString}\nPlease provide the missing params in the following format:\n${paramsFormat}\n`;  


  state['question'] = question;

  if(state['conversation']){
    state['conversation'].push({"role":"assistant", "content": question});
  }else{
    state['conversation'] = [{"role":"assistant", "content": question}];
  }

  await ChatHistory.update({"id": chatId}, {"graphState": state});  

  return {"question": question}
}

async function collectDataFromHuman(state){
  const { llm, dataFromHuman } = state;

  var messages = 
    [
      {
        "role": "system",
        "content": `You are an expert customer representative who rephrases provided missing_info in form of question to collect information from user. You should STRICTLY limit your questions to collect missing_info provided by the user and DO NOT add questions on your own. Format your reponse in HTML format for better representation.
          `
      },{
        "role": "user",
        "content": `{missing_info: ${JSON.stringify(params)}}`
      }
  ];

  var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});

  return {"question": response[0]['message']['content']}
}

module.exports = {
  readUserInput,
  parseUserInput,
  requestParameters,
  collectDataFromHuman
};
