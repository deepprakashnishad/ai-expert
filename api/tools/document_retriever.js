const { Pinecone } = require("@pinecone-database/pinecone");
const { Document } = require("@langchain/core/documents");
const { PineconeStore } = require("@langchain/pinecone");
const { OpenAIEmbeddings, ChatOpenAI } = require("@langchain/openai");

const pinecone = new Pinecone({apiKey: sails.config.custom.PINECONE_API_KEY});

const pineconeIndex = pinecone.Index('ragdoc');

async function document_retriever(state){

	var { llm, query, conversation, chatId } = state;

	var result = await sails.helpers.chatGptEmbedding.with({inputTextArray: [query]});

	quesEmbeddingData = result[0].embedding;

	const cvectorColl = Cvector.getDatastore().manager.collection(Cvector.tableName);

	var matchedInfo = await cvectorColl.aggregate([
			{
				"$vectorSearch": {
			    "queryVector": quesEmbeddingData,
			    "path": "e",
			    "numCandidates": 100,
			    "limit": 5,
			    "index": "cvectorIndex",
				}
			},
			{
				"$project": {
					"_id":0,
					"p": 0,
					"e": 0,
					"createdAt": 0,
					"updatedAt": 0,
					"score": { $meta: "vectorSearchScore" }
				}
			}
		]).toArray()

	/*const matchedInfo = await pineconeIndex.query({
		topK: 5,
		vector: quesEmbeddingData,
		includeValues: true,
		includeMetadata: true
	})*/

	/*const vectorStore = await PineconeStore.fromExistingIndex(
	  new OpenAIEmbeddings(),
	  { pineconeIndex }
	);

	const matchedInfo = await vectorStore.similaritySearch(query, 5, {});*/

	var messages = [
		{
			"role": "system",
			"content": `You are an assistant chatbot named Celina who can chat in many language of the world. You should greet users, introduce yourself and tell them how can you help them when they say Hi, Hello etc. When they ask any question, you should answer users question based on the info given below. Your answer should be in context of the provided information and conversation only. You should not add inputs from your side but you can translate, rephrase etc to provide the answer. In case related information is not present in info provided below or in past messages simply tell user that it is out of context or you don't have any idea of it or some similar reply. Your answer  must be contained in basic html tags so that it is presented to user in best possible user friendly way. Replace with newline character with <br> or <div> or <p> tags can be used, points should be return as ordered or unordered list.\n
				{info: ${JSON.stringify(matchedInfo)}}
			`
		}
	]

	if(!conversation){
		conversation = [];
	}else{
		messages = messages.concat(conversation);
	}

	messages.push({"role": "user", "content": query});

	var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});

	result = result[0]['message']['content'];

	conversation.push({"role":"user", "content": query});
	conversation.push({"role":"assistant", "content": result});

	state['conversation'] = conversation;

	await ChatHistory.update({"id": chatId}, {"graphState": state});

	return {
		conversation: conversation,
		finalResult: result
	}
}

module.exports = {
  document_retriever,
};
