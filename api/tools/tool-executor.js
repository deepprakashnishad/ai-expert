const toolsLib = require("./../tools");
const { z, ZodObject } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');
const {TavilySearchResults} = require("@langchain/community/tools/tavily_search");
const { MyGmailSearch, MyGmailGetThread, MyGmailGetMessage, MyGmailSendMessage, MyGmailCreateDraft} = require("./gmailApiService.js");
const { initializeAgentExecutorWithOptions } = require("langchain/agents");

const path = require("path");

function isZodObject(schema){
	return schema instanceof ZodObject;
}

const toolMap = {
	TavilySearchResults,
	MyGmailSearch,
	MyGmailSendMessage,
	MyGmailGetMessage,
	MyGmailGetThread,
	MyGmailCreateDraft
	// ...toolsLib
}

async function toolExecutor(state){
	const {llm, user} = state;

	var {finalResult, conversation} = state;

	var userQuery = conversation[conversation.length-1]['content'];

	const {toolName, prompt, output, inputParams} = state.extraData;

	const ToolRef = toolMap[toolName];
	var instance;

	if(toolName.toLowerCase().includes("gmail")){
		const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), './auto-gpt-service-account.json');
		const serviceAccount = require(SERVICE_ACCOUNT_PATH);

		// These are the default parameters for the Gmail tools
		const gmailParams = {
		    credentials: {
		      clientEmail: serviceAccount.client_email,
		      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'), // Ensure proper formatting
		    },
		    scopes: ["https://mail.google.com/"],
		};
		instance = new ToolRef(gmailParams);	
	}else{
		instance = new ToolRef();
	}

	var parameters = instance.schema;
	try{
		parameters = zodToJsonSchema(parameters);
	}catch(e){
		console.log(e);
	}

	/*var messages = [
		{
			role: "system",
			content: `You are an intelligent assistant responsible for extracting relevant information from the provided data to determine if a specific tool can be invoked.

Here are the details:

1. **Input Data** (in JSON format):
   {
       "info": {
           "userQuery": ${userQuery},  // A general query from the user
           "extraData": ${JSON.stringify(user)},  // Additional context and data
           "tool_name": ${instance.name},  // Name of the tool
           "tool_description": ${instance.description},  // Description of the tool
           "toolInputSchema": ${parameters}  // Schema defining the required input parameters for the tool
       }
   }

2. **Requirements for Tool Invocation**:
   - Extract necessary values from the 'info' object.
   - Validate whether the extracted values satisfy the criteria for invoking the tool.
   - Construct the 'toolInputParameters' according to the specified toolInputSchema.

3. **Output Format**:
   {
       "canCallTool": true, // Indicates whether the tool can be called or not
       "toolInputParameters": { // Must match the structure defined in toolInputSchema
           // Populate this object with extracted values that conform to the toolInputSchema
       }
   }

Your task is to determine whether the tool can be called based on the provided data and extract the necessary input parameters accordingly, ensuring that the 'toolInputParameters' adhere exactly to the 'toolInputSchema'.
`
		}
	];
	var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
	result = JSON.parse(result[0]['message']['content']);
	if(result['canCallTool']){
		console.log(result);
		let output = await instance._call(result['toolInputParameters']);
		console.log(output);
		return {finalResult: output}
	}else{
		return {}
	}*/
	
	const agentExecutor = await initializeAgentExecutorWithOptions([instance], llm, {
	    agentType: "structured-chat-zero-shot-react-description",
	    verbose: true,
  	});

  	if(finalResult){
  		if(typeof finalResult==="object" && finalResult!==null){
  			finalResult = JSON.stringify(finalResult);
  		}
  	}

	const instruction = `${prompt}
						Following is the input:
						{input: ${JSON.stringify(inputParams)}, userQuery: ${userQuery}, info: ${finalResult}, extraData: ${JSON.stringify(user)}}
						Output must be strictly in following format only:
						{output: ${JSON.stringify(output)}}`;

	var result = await agentExecutor.invoke({input: instruction});
	result = result['output']

	return {
		finalResult: result
	}
}

module.exports = {
	toolExecutor
}