var srs = "";

module.exports = {

	callTextCompletions: async function(req, res){
		var messages = [
		    {
		        "role": "system",
		        "content": `You are an expert software engineer. Your task is to extract values of the parameters from the conversation provided. In case you do NOT find value for a parameter then skip it and do not include in your result untill a default value is provided in the parameter list. Return empty object in case value for any of the parameters are found. Also DO  NOT INSERT parameters on your own. Response must be in json format.
		        Parameters: Name: phone_number, Description: , Type: NUMBER
    `
		    },
		    {
		        "role": "user",
		        "content": "I'm researching WhatsApp for Business accounts. If I provide you a mobile number will you be able to help me determine if it is a business account."
		    }
		]
		var result = await sails.helpers.callChatGpt.with({"messages": messages});
		res.successResponse({data:result, "tempo": "high"}, 200, null, true, "Record found");
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
	},

	genStrengthWeakness: async function(req, res){
		var result = await sails.helpers.genProdStrengthWeakness.with({
			reviews: req.body.reviews
		});
		console.log(result);
		return res.successResponse({data:result}, 200, null, true, "Summary generated");
	},

	dataCollector: async function(req, res){ 

		var messages = [ 
			{
				"role": "system",
				"content": `You are a 'Professional Business Analyst' who is expert in understanding user requirements,
				collecting requirements, data and any information required for implementing the
				given requirement. You will be provided with user input alongwith an SRS optionally. You generate SRS based 
				on your knowledge and input provided by the user. You may ask questions if you are looking for specific information.
				In case one liner is provided you must still generate the SRS based on your knowledge. Your response must in below JSON format only.

				{
					question: {question},
					srs: {srs}
				}`
			}, 
			{
				"role": "user", 
				"content": `
				{existing_SRS: "{SRS}",
				user_current_msg: "{curr_msg}"}`
			}
		]

    	messages[1]['content'] = messages[1]['content']
    	.replace("{curr_msg}", req.body.userInput)
    	.replace("{SRS}", srs);
    	
		var result = await sails.helpers.callChatGpt.with({
			"messages": messages, 
			"max_tokens": req.body.max_tokens?req.body.max_tokens:2500
		});

		srs = JSON.parse(result[0]["message"]['content'])['srs'];

		return res.successResponse({data:result}, 200, null, true, "Record found");
	},

	technicalAnalysis: async function(req, res){

		if(!srs){
			srs = JSON.stringify(req.body)
		}

		var messages = [ 
			{
				"role": "system",
				"content": `You are a 'Professional Software Architect' who is expert in understanding the given SRS,
				and create overall architecture, structure of the system, technical constraints, system specifications,
				modules, classes, function declarations with arguments, return type and database design. You must explan in detail what each function does, which table is updated so that it is easy for developer to write the code. Your output must be in JSON format as follows

				{
					modules: {modules},
					classes: {classes},
					database: {tables}
				}`
			}, 
			{
				"role": "user", 
				"content": `{srs: "{SRS}"`
			}
		]

    	messages[1]['content'] = messages[1]['content']
    	.replace("{SRS}", srs);
    	
		var result = await sails.helpers.callChatGpt.with({
			"messages": messages, 
			"max_tokens": req.body.max_tokens?req.body.max_tokens:2500
		});

		srs = JSON.parse(result[0]["message"]['content'])['srs'];

		return res.successResponse({data:result}, 200, null, true, "Record found");
	},

	softwareEngg: async function(req, res){
		var messages = [ 
			{
				"role": "system",
				"content": `You are a 'Professional Full Stack Developer' who is expert in writing elegant, clean code with proper comments as per SRS provided to you. You also make changes to existing code as per required changes or the bug that has to be fixed. Before fixing the code you do complete impact analysis so that your changes do not impact other component of the software. Your output must be in JSON format as follows

				{
					functions: {
						filename: {filename},
						function_name: {function_name},
						arguments: {args},
						codesnippet: {complete_code_implementation},
						result: {function_return_result}
					}
				}`
			}, 
			{
				"role": "user", 
				"content": `{
					srs: "{SRS}",
					tech_specs: "{technical_spec}"
				}`
			}
		]

    	messages[1]['content'] = messages[1]['content']
    	.replace("{SRS}", JSON.stringify(req.body.srs))
    	.replace("{technical_spec}", JSON.stringify(req.body.technical_spec));
    	
		var result = await sails.helpers.callChatGpt.with({
			"messages": messages, 
			"max_tokens": req.body.max_tokens?req.body.max_tokens:2500
		});

		srs = JSON.parse(result[0]["message"]['content'])['srs'];

		return res.successResponse({data:result}, 200, null, true, "Record found");
	},

	softwareDeveloper: async function(req, res){
		var messages = [ 
			{
				"role": "system",
				"content": `You are a 'Professional Full Stack Developer' who is expert in implementing functions by writing code into the functions in language provided. You also make changes to existing code as per required changes or the bug that has to be fixed. Before fixing the code you do complete impact analysis so that your changes do not impact other component of the software. Your output must be in JSON format as follows

				{
					final_code: {final_code}
				}`
			}, 
			{
				"role": "user", 
				"content": `{
					database: "sql",
					language: {language},
					srs: "{SRS}",
					function_declaration: "{function_declaration}"
				}`
			}
		]

    	messages[1]['content'] = messages[1]['content']
    	.replace("{language}", JSON.stringify(req.body.language))
    	.replace("{SRS}", JSON.stringify(req.body.srs))
    	.replace("{function_declaration}", JSON.stringify(req.body.function_declaration));
    	
		var result = await sails.helpers.callChatGpt.with({
			"messages": messages, 
			"max_tokens": req.body.max_tokens?req.body.max_tokens:2500
		});

		srs = JSON.parse(result[0]["message"]['content'])['srs'];

		return res.successResponse({data:result}, 200, null, true, "Record found");
	}
}