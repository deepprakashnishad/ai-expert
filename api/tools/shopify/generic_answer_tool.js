const { z } = require("zod");
const { GENERIC_ANSWER_TOOL } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');
const { StructuredTool } = require("@langchain/core/tools");
const { sanitizeConversation } = require('./../utils.js');

class GenericAnswerTool extends StructuredTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "generic_answer_tool"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                userQuery: z.string(),
                conversation: z.array(z.any()).default([]),
                appId: z.number()
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GENERIC_ANSWER_TOOL
        });
    }

    async _call(arg) {

        /*var ch = await ChatHistory.findOne({id: arg['chatId']});
        var state = ch['graphState'] || {conversation: []};*/

        var userQuery = arg['userQuery'];

        var result = await sails.helpers.chatGptEmbedding.with({inputTextArray: [userQuery]});

        const quesEmbeddingData = result[0].embedding;

        const cvectorColl = Cvector.getDatastore().manager.collection(Cvector.tableName);

        var matchedInfo = await cvectorColl.aggregate([
                {
                    "$vectorSearch": {
                    "queryVector": quesEmbeddingData,
                    "filter": {
                        "cid": {
                          "$eq": arg['appId'].toString() // Filter by the category ID
                        }
                    },
                    "path": "e",
                    "numCandidates": 200,
                    "limit": 5,
                    "index": "cvectorIndex",
                    "distanceMetric": "cosine"
                    }
                },
                {
                    "$project": {
                        "_id":0,
                        "p": 0,
                        "e": 0,
                        "md": 0,
                        "cat": 0,
                        "itt": 0,
                        "d": 0,
                        "aid": 0,
                        "cid": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        "score": { $meta: "vectorSearchScore" }
                    }
                },
                {
                    "$sort": {
                        "score": -1 // Sort by score in descending order
                    }
                }
            ]).toArray();

        /*var messages = [
            {
                "role": "system",
                "content": `Be a chatbot assistant. You must respond to user queries exclusively in the user's language. If the provided information is in a different language, translate it to the user's language before including it in your response. If the information provided is not sufficient, suggest helpful actions and avoid using the word "Sorry." Always format your answers using HTML tags like <p>, <ul>, <li>, <h2>, <div>, etc.\n
                {info: ${JSON.stringify(matchedInfo)}}
                `
            }
        ]*/

        console.log("Matched Content");
        console.log(matchedInfo);

        var messages = [
            {
                "role": "system",
                "content": `You are Devika, a chatbot assistant. Use the following guidelines to chat:

                1. Ensure your response is clear, accurate, and directly addresses the user's query from the provided info only.
                2. Use past conversation if any to understand the context.
                2. If the provided info is not sufficient, suggest helpful actions or next steps. Do not use the word "Sorry" or express regret. NEVER add information from your side.
                    {
                        info: ${JSON.stringify(matchedInfo)}
                    }
                `
            }
        ];

        if(!arg['conversation']){
            arg['conversation'] = [];
        }else{
            messages = messages.concat(sanitizeConversation(arg['conversation']));
        }
        messages.push({"role": "user", "content": userQuery});

        console.log(messages);
        var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});

        result = result[0]['message']['content'];

        console.log(`LLM response - ${result}`)
        return result;
    }
}
 
module.exports = {GenericAnswerTool}; 