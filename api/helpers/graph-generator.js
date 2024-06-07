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

    var graphChannels = {
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

    /*if(inputs.state){
      var keys = Object.keys(inputs.state);
      for(var i=0;i < keys.length;i++){
        graphChannels[keys[i]] = {"value": inputs.state[keys[i]]}
      }
    }*/
    graph = new StateGraph({
      channels: graphChannels,
    });

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
    }else{
      graph.setEntryPoint("extract_category_node");  
    }
    
    graph.setFinishPoint("human_loop_node");
    graph.setFinishPoint("execute_request_node");

    const app = graph.compile();
    return exits.success(app);
  }
};

