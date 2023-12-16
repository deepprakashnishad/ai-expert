module.exports = {

	callTextCompletions: async function(req, res){
		var result = await sails.helpers.callChatGpt.with({messages: req.body.messages});
		res.successResponse({data:result}, 200, null, true, "Record found");
	},

	translateQuestionInHtml: async function(req, res){
		/*var result = {
		  "data": [
		    {
		      "index": 0,
		      "message": {
		        "role": "assistant",
		        "content": "[{\"q\":\"<p><strong style=\\\"background-color: rgb(255, 255, 255); color: rgb(58, 58, 58);\\\">&nbsp;दो दिए गए दो SHMs के समयांतर के बीच क्या संबंध हैं।</strong></p><p><strong style=\\\"background-color: rgb(255, 255, 255); color: rgb(58, 58, 58);\\\">{{{img0}}}</strong></p>\",\"o0\":\"<p>4T1 = T2</p>\",\"o1\":\"<p>T1 = 2T2</p>\",\"o2\":\"<p>2T1 = T2</p>\",\"o3\":\"<p>T1 = 4T2</p>\"}]"
		      },
		      "logprobs": null,
		      "finish_reason": "stop"
		    }
		  ],
		  "success": true,
		  "msg": "Record found"
		}
		return res.successResponse(result, 200, null, true, "Record found");*/

		var messages = [
        	{"role": "system","content": "You are a translator who translates in any language asked. You simply translate and never alter the meaning of the content"},
        	{"role": "user", "content": "Translate the text present in html tags in json values from English to {output_lang} language. Text can be reordered but original meaning should be preserved. Do not alter text in triple braces. {mText}. Response should be in valid json format."}
    	]

    	messages[1]['content'] = messages[1]['content'].replace("{output_lang}", req.body.lang).replace("{mText}", JSON.stringify(req.body.content));

		var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": req.body.max_tokens?req.body.max_tokens:1500});
		
		return res.successResponse({data:result}, 200, null, true, "Record found");
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
		]).toArray(async(err, results)=>{
			console.log(results);
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
			// res.successResponse({data:messages}, 200, null, true, "Record found");
			res.successResponse({data:result}, 200, null, true, "Response from AI bot");
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