// index.js
const generic = require('./generic');
const module2 = require('./demo2');
const extract_category = require('./extract-category');
const select_api_tool = require('./select-api-tool');
const llm_factory = require('./llm_factory');
const extract_parameters = require('./extract-parameters')
const request_parameters = require('./request-parameters')
const create_fetch_request = require('./create-fetch-request')
const utils = require('./utils');
const sql_db = require('./sql_db.js');
const gmail = require('./gmailApiService.js');
const document_retriever = require('./document_retriever.js');
// Add more module imports as needed
const { DynamicTool, DynamicStructuredTool } = require("@langchain/core/tools");


const {TavilySearchResults} = require("@langchain/community/tools/tavily_search");

module.exports = {
  ...generic,
  ...module2,
  ...llm_factory,
  ...extract_category,
  ...select_api_tool,
  ...extract_parameters,
  ...request_parameters,
  ...create_fetch_request,
  ...utils,
  ...sql_db,
  ...document_retriever,
  ...gmail,
  // Include other modules similarly

  toolGeneratorFactory: async function(llm, tool){
    console.log(tool);
  	if(tool['type'] === "api"){
      var params = {};
      if(tool['api_url']){
        params['url'] = tool['api_url'];
      }else{
        return null;
      }
      if(tool['method']){
        params['method'] = tool['method']
      }else{
        return null;
      }
  		if(tool['url_params']){
  			params['params'] = tool['url_params']
  		}else{
        params['params'] = tool['url_params']
      }
  		if(tool['required_parameters'] || tool['optional_parameters']){
  			params['body'] = tool['required_parameters'].concat(tool['optional_parameters']);
  		}else{
        params['body'] = {}
      }
  		if(tool['queryParams']){
  			params['queryParams'] = tool['queryParams']
  		}else{
        params['queryParams'] = {}
      }
  		if(tool['headers']){
  			params['options'] = {'headers': tool['headers']}
  		}else{
        params['options'] = {}
      }
  		return new DynamicTool({
        name: tool['name'],
        description: tool['description'],
        func: generic.apiCaller
      })
  	}else if(tool['type'] === "sql"){
  		return new DynamicTool({
        name: tool['name'],
        description: tool['description'],
        func: sql_db.execute_db_operation,
      }); //generic.sqlDBCaller(params['db_name'], params['prompt'], params['question'], params['tables']);
  	}else if(tool['type'] === "langchain"){
  		return new TavilySearchResults();
  	}
  },

  checkSailsAccess: async function(){
    var agents = await Agent.find();
    console.log(agents)
    return agents;
  }
};