const { Pinecone } = require("@pinecone-database/pinecone");
const { Document } = require("@langchain/core/documents");
const { PineconeStore } = require("@langchain/pinecone");
const { OpenAIEmbeddings, ChatOpenAI } = require("@langchain/openai");

const pinecone = new Pinecone({apiKey: sails.config.custom.PINECONE_API_KEY});

const pineconeIndex = pinecone.Index('ragdoc');

async function document_retriever(state){

	const { llm, query, conversation } = state;

	var result = await sails.helpers.chatGptEmbedding.with({inputTextArray: [query]});

	quesEmbeddingData = result[0].embedding;

	console.log(quesEmbeddingData);

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

	console.log(matchedInfo);

	var messages = [
		{
			"role": "system",
			"content": `Answer users based on the info below. Your answer should be in context to provided information and conversation only. Do not add inputs from your side. In case you don't know simply say "I am sorry, I don't know."
				info: ${JSON.stringify(matchedInfo)}
			`
		}
	]

	if(!state['conversation']){
		state['conversation'] = [];
	}else{
		messages = messages.concat(conversation);
	}

	messages.push({"role": "user", "content": query});

	console.log(messages);

	var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});

	result = result[0]['message']['content']
	console.log(result);

	state['conversation'].push({"role":"user", "content": query});
	state['conversation'].push({"role":"assistant", "content": result});

	return {
		conversation: state['conversation'],
		finalResult: result
	}
}

module.exports = {
  document_retriever,
};
