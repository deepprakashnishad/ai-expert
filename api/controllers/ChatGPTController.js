module.exports = {

	callTextCompletions: async function(req, res){
		var result = await sails.helpers.callChatGpt.with({messages: req.body.messages});
		res.successResponse({data:result}, 200, null, true, "Record found");
	},

	customAIReply: async function(req, res){
		var messages = req.body.messages;
		var currMessage = messages;
		if(Array.isArray(currMessage)){
			currMessage = messages[messages.length-1]['content'];
		}
		var result = await sails.helpers.chatGptEmbedding.with({inputTextArray: [currMessage], userId: req.body.personId});

		quesEmbeddingData = result[0].embedding;

		const cvectorColl = Cvector.getDatastore().manager.collection(Cvector.tableName);

		await cvectorColl.aggregate([
			{
				"$vectorSearch": {
			    "queryVector": quesEmbeddingData,
			    "path": "e",
			    "numCandidates": 100,
			    "limit": 2,
			    "index": "cvectorIndex",
				}
			},
			{
				"$project": {
					"_id":0,
					"p": 0,
					"e": 0,
					"createdAt": 0,
					"updatedAt": 0
				}
			}
		]).toArray(async(err, results)=>{
			var info = "";

			for(var result of results){
				info = info + "\n"+result.it;
			}
			var userQuestion = messages[messages.length-1]['content'];
			var mPrompt = `###${info}### '''${userQuestion}'''`;
			messages[messages.length-1]['content'] = mPrompt;
			console.log(messages);
			var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 256});
			console.log(result);

			res.successResponse({data:result}, 200, null, true, "Record found");
		});
	},

	createEmbeddings: async function(req, res){
		var result = await sails.helpers.chatGptEmbedding.with({inputTextArray: req.body.data, userId: req.body.personId});

		var embeddingData = [];

		for(var embedding of result){
			embeddingData[embedding.index] = {p: req.body.personId, it: req.body.data[embedding.index], e: embedding.embedding};
		}

		await Cvector.createEach(embeddingData);
	
		return res.successResponse({}, 200, null, true, "Embeddings created");
	}
}