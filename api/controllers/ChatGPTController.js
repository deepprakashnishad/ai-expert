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
		                "content": "[{\"id\":\"6571b0172c7df800287956ea\",\"q\":\"<p><strong>यदि एक साथ चार पासा फेंके जाते हैं तो कुल संभावित परिणामों की संख्या क्या होगी?</strong></p>\",\"o0\":\"<p>6</p>\",\"o1\":\"<p>36</p>\",\"o2\":\"<p>216</p>\",\"o3\":\"<p>1296</p>\"},{\"id\":\"6571b0022c7df800287956e9\",\"q\":\"<p><strong>&nbsp;यदि n सिक्के एक साथ फेंके जाते हैं तो कुल परिणामों की संख्या क्या होगी?</strong></p>\",\"o0\":\"<p><span class=\\\"ql-formula\\\" data-value=\\\"2^{n-2}\\\">{{{qf0}}}</span> </p>\",\"o1\":\"<p><span class=\\\"ql-formula\\\" data-value=\\\"2^{n-1}\\\">{{{qf0}}}</span> </p>\",\"o2\":\"<p><span class=\\\"ql-formula\\\" data-value=\\\"2^n\\\">{{{qf0}}}</span> </p>\",\"o3\":\"<p><span class=\\\"ql-formula\\\" data-value=\\\"2^{n+1}\\\">{{{qf0}}}</span> </p>\"},{\"id\":\"6571af7a2c7df800287956e8\",\"q\":\"<p><strong>यदि P (1, 2), Q (3, 5), R (7, 9) एक त्रिभुज बनाते हैं, तो P से माध्यिका की समीकरण क्या होगी।</strong></p>\",\"o0\":\"<p>5x-4y+3 = 0</p>\",\"o1\":\"<p>5x+4y+3 = 0</p>\",\"o2\":\"<p>5x-4y-3 = 0</p>\",\"o3\":\"<p>5x+4y-3 = 0</p>\"},{\"id\":\"6571af622c7df800287956e7\",\"q\":\"<p><strong>यदि -40°F बराबर है -40°C और 0°C बराबर है 32°F तो 40°C का मान क्या होगा।</strong></p>\",\"o0\":\"<p>104°F</p>\",\"o1\":\"<p>112°F</p>\",\"o2\":\"<p>86°F</p>\",\"o3\":\"<p>92°F</p>\"},{\"id\":\"6571af442c7df800287956e6\",\"q\":\"<p><strong>यदि एक रेखा का निर्माण शुरुआती स्थान से लंबवत दूरी 4 इकाई है और नियमित कोण पॉजिटिव x-अक्ष के साथ बनाता है 45°, तो समीकरण होगा ______________</strong></p>\",\"o0\":\"<p>x + y = 4√2</p>\",\"o1\":\"<p>x – y = 4√2</p>\",\"o2\":\"<p>y – x = 4√2</p>\",\"o3\":\"<p>x + y = -4√2</p>\"},{\"id\":\"6571af222c7df800287956e5\",\"q\":\"<p><strong>यदि एक रेखा का x-अंतरबिंदु 4 है और इसका y-अंतरबिंदु 2 है तो रेखा का समीकरण क्या होगा।</strong></p>\",\"o0\":\"<p>2x+y-4=0</p>\",\"o1\":\"<p>x+2y-4=0</p>\",\"o2\":\"<p>2x+y+4=0</p>\",\"o3\":\"<p>x+2y+4=0</p>\"},{\"id\":\"6571aefc2c7df800287956e4\",\"q\":\"<p><strong>यदि रेखा का ढाल 4 है और रेखा द्वारा बनाया गया y-अंतरबिंदु 2 है तो रेखा का समीकरण होगा __________</strong></p>\",\"o0\":\"<p>y=4x-2</p>\",\"o1\":\"<p>y=4x+2</p>\",\"o2\":\"<p>y=2x+4</p>\",\"o3\":\"<p>y=2x-4</p>\"},{\"id\":\"6571aec92c7df800287956e3\",\"q\":\"<p><strong>एक्स-अक्ष के ऊपरी इंटरसेप्ट से 5 इकाई दूरी पर स्थित लचीली रेखा का समीकरण _______ होगा</strong></p>\",\"o0\":\"<p>x=5</p>\",\"o1\":\"<p>x=-5</p>\",\"o2\":\"<p>y=5</p>\",\"o3\":\"<p>y=-5</p>\"}]"
		            },
		            "logprobs": null,
		            "finish_reason": "stop"
		        }
		    ],
		    "success": true,
		    "msg": "Record found"
		}
		return res.successResponse(result, 200, null, true, "Record found");*/
		console.log("Questions Translation Request Recieved");
		console.log("Input length"+JSON.stringify(req.body.content).length);
		var messages = [
        	{"role": "system","content": "You are a translator who translates in any language asked. You simply translate and never alter the meaning of the content"},
        	{"role": "user", "content": "Translate the text present in html tags in json values from English to {output_lang} language. Text can be reordered but original meaning should be preserved. Do not alter text in triple braces. {mText}. Response should be in valid json format."}
    	]

    	messages[1]['content'] = messages[1]['content'].replace("{output_lang}", req.body.lang).replace("{mText}", JSON.stringify(req.body.content));
    	var contentLength = JSON.stringify(messages).length;
    	console.log(contentLength);
		var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": req.body.max_tokens?req.body.max_tokens:2500});

		console.log("Questions Translation Completed");
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