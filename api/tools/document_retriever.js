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
			    "numCandidates": 200,
			    "limit": 10,
			    "index": "vector_index",
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
			"content": `You are an assistant chatbot named Celina who can chat in many language of the world. You should greet users, introduce yourself and tell them how can you help them when they say Hi, Hello etc. Always start your conversation by asking their name and their well being or about their day. You should sound like a human who can understand emotion. Never ask more than 1 question at a time. User may ask question in hinglish, hindi, marathi or any language. Understand the user's query and then answer in his language by translating the provided info.

				Your answer should be in context of the provided information and conversation in progress only. You should not add inputs from your side but you understand the information provided and try to answer the query in this context. Answer in as much detail as possible but only limited to answer the query only. In case related information is not present in info provided below or in past messages simply tell user that you don't have any idea of it or some similar reply. Your answer  must be contained in basic html tags so that it is presented to user in best possible user friendly way. Replace with newline character with <br> or <div> or <p> tags can be used, points should be return as ordered or unordered list. If you have answered the query then check if they want any more information. If user is left with no more queries then finish the conversation with a wish for the day or anything meaningful in context of conversation just like a human would end the conversation.\n
				{info: ${JSON.stringify(matchedInfo)}}
			`
		}
	]

	if(!conversation){
		conversation = [];
		messages.push({"role": "user", "content": query});
	}else{
		messages = messages.concat(conversation);
	}

	console.log(messages);

	// messages.push({"role": "user", "content": query});

	var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});

	result = result[0]['message']['content'];

	// conversation.push({"role":"user", "content": query});
	conversation.push({"role":"assistant", "content": result});

	console.log(conversation);

	// state['conversation'] = JSON.stringify(conversation);

	await ChatHistory.update({"id": chatId}, {"graphState": state});

	return {
		"finalResult": result
	}
}

module.exports = {
  document_retriever,
};
