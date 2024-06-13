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
// Add more module imports as needed

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
  // Include other modules similarly

  toolGeneratorFactory: async function(funcName, params){
  	if(funcName === "apiCaller"){
  		if(!params['params']){
  			params['params'] = {}
  		}
  		if(!params['body']){
  			params['body'] = {}	
  		}
  		if(!params['queryParams']){
  			params['queryParams'] = []
  		}
  		if(!params['options']){
  			params['options'] = {}
  		}
  		return generic.apiCaller(
  			params['method'], 
  			params['url'], 
  			params['queryParams'], 
  			params['body'], 
  			params['params'], 
  			params['options']
		);
  	}else if(funcName === "sqlDBCaller"){
  		return generic.sqlDBCaller(params['db_name'], params['prompt'], params['question'], params['tables']);
  	}else if(funcName === "tavilySearch"){
  		return new TavilySearchResults();
  	}
  },

  checkSailsAccess: async function(){
    var agents = await Agent.find();
    console.log(agents)
    return agents;
  }
};