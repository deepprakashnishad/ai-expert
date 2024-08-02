async function resultVerifier(state){
	const {llm, query, finalResult, apis, toolUsed} = state;

	var messages = [
		{
			"role": "system",
			"content": `You are intelligent supervisor whose task is to verify if the user query has been served or not. To determine this you should analyze toolUsed which contains name of tool used alongwith the result it has obtained. Using the results provided for each toolUsed construct a final result. If you think user query cannot be served by both means then you should determine the next tool to use to fulfill the user's request. You may suggest prompt for the next step or parameters that should be used.

				{
					toolUsed: ${JSON.stringify(toolUsed)},
					tools: ${JSON.stringify(apis)},
					query: ${query}
				}

				Output must be in json format as follows:
				{
					"is_result_acceptable": "true or false",
					"prompt": "llm_generated_prompt_if_any",
					"tool": {
						"name":"next_tool_name_to_use",
						"parameters": {
							param_1_name: param_1_value,
							param_2_name: param_2_value,
							param_3_name: param_3_value,
							.
							.
							.
							param_n_name: param_n_value,
						},
					"finalResult": "Final constructed result. Leave it blank if final result cannot be constructed"
				}
			`
		}
	]

	var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
  	response = JSON.parse(response[0]['message']['content']);

  	console.log(response);

  	return {
		"is_result_acceptable": response['is_result_acceptable'],
		"prompt": response['prompt'],
		"tool": response['tool'],
		"next_node": response['tool']['name'],
		"finalResult": result['finalResult']
	}
}

function nextActionDecisionMaker(state){
	const {next_node, is_result_acceptable } = state;
	if(is_result_acceptable){
		return "pdfGenerator";	
	}else{
		return next_node;		
	}
	
}

module.exports = {
	resultVerifier,
	nextActionDecisionMaker
}