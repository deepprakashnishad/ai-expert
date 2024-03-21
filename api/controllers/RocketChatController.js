const axios = require('axios');

module.exports = {

	recieveUserMessage: async function(req, res){
		console.log(req.body);
		/* var result = await sails.helpers.callChatGpt.with({messages: [
			{
				"role": "system",
				"content": "You are a chatbot who can chat in world's any language and helps people with their queries just like ChatGPT chatbot works. You reply to the question provided in triple backticks in context of conversation. If are not sure of the answer from the information provided simply say I don't know."
			}, 
			{role: "user", content: `${req.body.messages[0].msg}`}
		]});
		console.log("Request processed");
		console.log(result);
		res.successResponse({data:result}, 200, null, true, "Record found"); */

		/* axios.post(sails.custom.config.ROCKET_CHAT_MSG_HOOK, {
			text: result[0].message.content,
			alias: "Astrina"
		}).then(function(res){
			console.log(res);
		}) */

		res.ok(200);

		axios.post(sails.config.custom.ROCKET_CHAT_MSG_HOOK, {
			text: "Pong",
			alias: "Astrina"
		}).then(function(res){
			console.log(res);
		})

		/* var messages = req.body.messages;
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
		}); */
	},

}