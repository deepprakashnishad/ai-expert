const { Pinecone } = require("@pinecone-database/pinecone");
const { Document } = require("@langchain/core/documents");
const { PineconeStore } = require("@langchain/pinecone");
const { OpenAIEmbeddings, ChatOpenAI } = require("@langchain/openai");

const pinecone = new Pinecone({apiKey: sails.config.custom.PINECONE_API_KEY});

const pineconeIndex = pinecone.Index('ragdoc');

async function document_retriever(state){

	var { llm, query, conversation, chatId, user } = state;

	var userQuery = conversation[conversation.length-1]['content'];

	var result = await sails.helpers.chatGptEmbedding.with({inputTextArray: [userQuery]});

	quesEmbeddingData = result[0].embedding;

	const cvectorColl = Cvector.getDatastore().manager.collection(Cvector.tableName);

	var matchedInfo = await cvectorColl.aggregate([
			{
				"$vectorSearch": {
			    "queryVector": quesEmbeddingData,
			    "filter": {
				    "cid": {
				      "$eq": user.appId.toString() // Filter by the category ID
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

	var messages = [
		{
			"role": "system",
			"content": `Be a chatbot assistant. Use the following guidelines to chat:

			1. Ensure your response is clear, accurate, and directly addresses the user's query from the provided info only.
			2. If the provided info is not sufficient, suggest helpful actions or next steps. Do not use the word "Sorry" or express regret. NEVER add information from your side.
			3. Use HTML tags like <p>, <ul>, <li>, <h2>, <div>, etc., to format your answers properly.\n
				{info: ${JSON.stringify(matchedInfo)}}
			`
		}
	];

	if(!conversation){
		conversation = [];
		messages.push({"role": "user", "content": userQuery});
	}else{
		messages = messages.concat(conversation);
	}

	/*if(matchedInfo.length === 0){
		result = `<p>No information is found related to the query. May I helpful you with something else.<\p>`
	}else{*/
	
	var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});

	result = result[0]['message']['content'];
	/*}*/

	conversation.push({"role":"assistant", "content": result});

	await ChatHistory.update({"id": chatId}, {"graphState": state});

	return {
		"finalResult": result
	}
}

module.exports = {
  document_retriever,
};
