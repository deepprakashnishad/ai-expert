const axios = require('axios');

var token;
var userId;

module.exports = {

	authenticate: async function(req, response){
		axios.post(
			`${sails.config.custom.ROCKET_CHAT.BASE_URL}${sails.config.custom.ROCKET_CHAT.AUTH_URL}`,
			{
				user: sails.config.custom.ROCKET_CHAT.USERNAME, 
				password: sails.config.custom.ROCKET_CHAT.PASSWORD,
			}
		).then(function(res){
			if(res.data.status==="success"){
				token = res.data.data.authToken;
				userid = res.data.data.userId

				console.log(`Token: ${token}`);
				console.log(`UserId: ${userid}`);
				response.json(res.data);
			}else{
				console.log("Authentication Failed")
			}
		})
	},

	recieveUserMessage: async function(req, res){
		var rcData = req.body;
		console.log(rcData);
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

		res.ok(200);

		if(!token || !userId){
			var authResult = await axios.post(`${sails.config.custom.ROCKET_CHAT.BASE_URL}${sails.config.custom.ROCKET_CHAT.AUTH_URL}`, {
				user: sails.config.custom.ROCKET_CHAT.USERNAME,
				password: sails.config.custom.ROCKET_CHAT.PASSWORD
			});
			authResult = authResult.data;
			if(authResult.status==="success"){
				token = authResult.data.authToken;
				userId = authResult.data.userId;
			}else{
				console.log("Authentication failed");
				console.log(authResult);
			}
		}

		const headers = {
			'Content-Type': 'application/json',
			'x-auth-token': token,
			'x-user-id': userId
		}

		axios.post(`${sails.config.custom.ROCKET_CHAT.BASE_URL}${sails.config.custom.ROCKET_CHAT.SEND_MSG}`, {
			message:{
				rid: rcData['messages'][0]['rid'],
				msg: "Pong"
			}
		}, {"headers": headers}).then(function(res){
			console.log("Response from rocket chat");
			console.log(res.data);
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