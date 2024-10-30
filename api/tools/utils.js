const { z, ZodObject } = require('zod');
/**
 * @param {string[]} requiredParams
 * @param {string[]} extractedParams
 * @returns {string[]}
 */

function extractMissingParams(bestApi, params){
  const requiredParamsKeys = bestApi.required_parameters
        .filter((p) => {
          if(p.value){
            params[p.name] = p.value;
          }
          return p.value === undefined || p.value === null
        })
        .map((param) => param.name);

  const extractedParamsKeys = Object.keys(params);

  return findMissingParams(
      requiredParamsKeys,
        extractedParamsKeys
    );
}

function findMissingParams(requiredParams, extractedParams) {
  const missing = requiredParams.filter(
    (required) => !extractedParams.some((extracted) => extracted === required)
  );
  return missing;
}

function findZodMissingKeys(schema, params) {
  const extractedParams = Object.keys(params);
  const requiredKeys = Object.keys(schema.shape).filter(key => {
    return schema.shape[key].isOptional() !== true;
  });

  const optionalKeys = Object.keys(schema.shape).filter(key => {
    return schema.shape[key].isOptional() === true;
  });

  const missingKeys = {
    all: [],
    atleast_n: {}
  };

  // Check for missing required keys
  for (const key of requiredKeys) {
    const subSchema = schema.shape[key];

    // Check if a default value is provided, skip it if true
    if (subSchema._def.defaultValue !== undefined) {
      continue;
    }

    // If the parameter is missing or undefined
    if (!extractedParams.includes(key) || params[key] === undefined || params[key] === null) {
      missingKeys.all.push(key); // Key is completely missing
    } else if (subSchema instanceof z.ZodObject) {
      // If the key is a nested Zod object, recurse into it
      const nestedMissingKeys = findZodMissingKeys(subSchema, params[key]);
      missingKeys.all.push(...nestedMissingKeys.all.map(nestedKey => `${key}.${nestedKey}`));
    }
  }

  // Now handle optional keys, check how many of them are missing
  let totalMissingOptional = 0;
  for (const key of optionalKeys) {
    const subSchema = schema.shape[key];

    // Check if a default value is provided for optional keys, skip it if true
    if (subSchema._def.defaultValue !== undefined) {
      continue;
    }

    if (!extractedParams.includes(key) || params[key] === undefined || params[key] === null) {
      totalMissingOptional++;
    }
  }

  // Categorize optional missing keys for atleast_n
  if (totalMissingOptional > 0) {
    for (let n = 1; n <= totalMissingOptional; n++) {
      missingKeys.atleast_n[n] = optionalKeys.slice(0, n);
    }
  }

  return missingKeys;
}

function sanitizeConversation(conversation){
  if(!conversation){
    return [];
  }
  conversation.forEach(item => {
    // Check if the content is an object
    if (typeof item.content === 'object' && item.content !== null && item.content.msg) {
      // Replace content with msg
      item.content = item.content.msg;
    }
  });

  return conversation;
}

async function getCorrectedDataFromLLM(input){
  console.log(input);
  var messages = [
    {
      "role": "system",
      "content": "You are an expert of fixing issues. Understand the user and provide solution as per the request"
    },
    {
      "role": "user",
      "content": JSON.stringify(input)
    }
  ];
  console.log(messages);
  var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
  console.log("Done");
  console.log(response)
  return response[0]['message']['content'];
}

module.exports = {
  findMissingParams,
  findZodMissingKeys,
  sanitizeConversation,
  getCorrectedDataFromLLM
};
