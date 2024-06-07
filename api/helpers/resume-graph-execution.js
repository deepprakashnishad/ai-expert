const { END, StateGraph }  = require("@langchain/langgraph");

const toolsLib = require("./../tools");

const graphChannels = {
  llm: {
    value: null,
  },
  query: {
    value: null,
  },
  categories: {
    value: null,
  },
  apis: {
    value: null,
  },
  bestApi: {
    value: null,
  },
  params: {
    value: null,
  },
  response: {
    value: null,
  },
};

module.exports = {


  friendlyName: 'GraphGenerator',


  description: 'Generate Langchain graph',


  inputs: {
    id:{
      type: "string"
    },
    chatId: {
      type: "string"
    },
    state: {
      type: "json",
      defaultsTo: null
    }
  },


  exits: {
    success:{"description": "Graph generated"},
    msgMissing: {"description":"Missing id."}
  },


  fn: async function (inputs, exits) {

    const graphChannels = {
      llm: {
        value: null,
      },
      query: {
        value: null,
      },
      categories: {
        value: null,
      },
      apis: {
        value: null,
      },
      bestApi: {
        value: null,
      },
      params: {
        value: null,
      },
      response: {
        value: null,
      },
      question: {
        value: null,
      },
      lastExecutedNode: {
        value: null
      },
      chatId: {
        value: inputs.chatId?inputs.chatId: null
      }
    };

    var graph;

    if(inputs.state){
      graph = new StateGraph({
        channels: inputs.state,
      });
    }else{
      graph = new StateGraph({
        channels: graphChannels,
      });
    }

    graph.addNode("extract_category_node", toolsLib.extractCategory);
    graph.addNode("get_apis_node", toolsLib.getApis);
    graph.addNode("select_api_node", toolsLib.selectApi);
    graph.addNode("extract_params_node", toolsLib.extractParameters);
    graph.addNode("human_loop_node", toolsLib.requestParameters);
    graph.addNode("execute_request_node", toolsLib.createFetchRequest);

    graph.addEdge("extract_category_node", "get_apis_node");
    graph.addEdge("get_apis_node", "select_api_node");
    graph.addEdge("select_api_node", "extract_params_node");

    graph.addConditionalEdges("extract_params_node", toolsLib.verifyParams);

    graph.addConditionalEdges("human_loop_node", toolsLib.verifyParams);

    if(inputs.state && inputs.state.lastExecutedNode){
    	console.log(`Last Executed Node - ${inputs.state.lastExecutedNode}`)
    	graph.setEntryPoint(inputs.state.lastExecutedNode);	
    }
    
    graph.setFinishPoint("human_loop_node");
    graph.setFinishPoint("execute_request_node");

    const app = graph.compile();
    return exits.success(app);
  }
};

