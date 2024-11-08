/*Your response must contain a message for the user and a list of action names (only) of the probable options that you selected from the given available_choices.*/
/*Present a selection of relevant options that align with the user's potential interests from the available choices. Ensure the options are tailored, and remove any that don't fit. Do not filter options if there are any for the user to choose.*/
const declaredPrompts = {
	"optionPresenter":{
		"system": `
	        Role: You are an interactive and empathetic proactive support and sales chatbot. Your goal is to engage users, assist customers, and provide relevant options based on their statements from the following available choices. After all this, your main goal is to increase sales.
	        {available_choices: {{mainOptions}}}

	        Greeting Response:
	        When a user sends a greeting, respond warmly.
	        Present all the available choices.
	        
	        Disengaged or Negative Response:
	        If the user responds with phrases like "Nothing," "Not interested," or similar expressions indicating they are unable to take any action or are possibly leaving, respond with a gentle, empathetic message and present all available options to encourage them to explore.

	        Response Structure:
	        Your response must contain a message for the user and a list of all action names from the given available_choices.
	        
	        Format your responses in JSON like this:
	        {
	            "msg": "html_formatted_response",
	            "options": ["option_object1", "option_object2", "option_object3"]
	        }
	    `,
		"user": "{{userQuery}}",
		"includePastConversationCount": 0
	},
	"toolExtractParams": {
		"system": `Given a conversation and a list of parameters with types, extract and return parameter values as a JSON object. Omit parameters without values or mismatched types.
		          Parameters: [{{params}}],
		          conversation: {{conversation}}

		          Your json object as output must only contain keys from params. If any parameter have default value and you do not find value for that parameter then you must include it in your response with given default value. Try your best to get the values for params from the user query and provided conversation.
		          `,
		"user": "{{userQuery}}",
		"includePastConversationCount": 0,
		"systemKeys": ["params", "conversation"],
		"userKeys": ["userQuery"]	
	}
}

module.exports = {
	promptLLM: async function(promptId, systemData, userData, conversation, responseFormat="json"){
		var predefinedPrompts = declaredPrompts[promptId];
		var prompt;
		var messages = [];

		for(var key of Object.keys(systemData)){
			prompt = predefinedPrompts['system'].replace(`{{${key}}}`, typeof systemData[key]==="string"?systemData[key]: JSON.stringify(systemData[key]));
		}

		messages.push({"role": "system", "content": prompt})

		if(predefinedPrompts['conversation']>0 && conversation && conversation.length>0){
			try{
				var prevConv = conversation.splice(-1);
				messages.push(...prevConv);
			}catch{}
		}


		for(var key of Object.keys(userData)){
			prompt = predefinedPrompts['user'].replace(`{{${key}}}`, typeof userData[key]==="string"?userData[key]: JSON.stringify(userData[key]));
		}		
		messages.push({"role": "user", "content": prompt});

		console.log(messages);
		if(responseFormat==="text"){
			var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});	
			return result[0]['message']['content'];
		}else{
			var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
			return JSON.parse(result[0]['message']['content']);
		}
	}
}