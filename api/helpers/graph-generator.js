const { END, StateGraph }  = require("@langchain/langgraph");

const toolsLib = require("./../tools");

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
      selected_apis:{
        value: null,
      },
      next_node: {
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
      finalResult:{
        value: null
      },
      conversation: {
        value: [],
      },
      lastExecutedNode: {
        value: null
      },
      chatId: {
        value: inputs.chatId?inputs.chatId: null
      },
      is_result_acceptable: {
        value: null
      },
      prompt: {
        value: null
      },
      tool: {
        value: null
      },
      user: {
        value: null
      },
      toolUsed: {
        value: null
      },
      extraData: {
        value: null
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
    if(inputs.id.toLowerCase() === "marketing"){

    }
    else if(inputs.id.toLowerCase() === "shopify"){
      graph.addNode("getShopifyCustomerDetails", toolsLib.getShopifyCustomerDetails);
      graph.addNode("shopifyAgent", toolsLib.shopifyAgent);
      graph.addNode("response_formatter_node", toolsLib.responseFormatter);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);

      graph.addEdge("getShopifyCustomerDetails", "shopifyAgent");
      graph.addEdge("shopifyAgent", "response_formatter_node");
      graph.addConditionalEdges("response_formatter_node", toolsLib.isNextNode);
      graph.setEntryPoint("getShopifyCustomerDetails"); 
      graph.setFinishPoint("pdfGenerator"); 
    }
    else if(inputs.id === "Invoice Generator"){
      graph.addNode("setInvoiceGenerator", toolsLib.setInvoiceGenerator);
      // graph.addNode("odooApiSelector", toolsLib.odooApiSelector);
      graph.addNode("extract_params_node", toolsLib.extractParameters);
      graph.addNode("human_loop_node", toolsLib.requestParameters);
      graph.addNode("odooExecutor", toolsLib.odooExecutor)
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      graph.addNode("getCompleteInvoiceDetail", toolsLib.getCompleteInvoiceDetail);

      graph.addEdge("setInvoiceGenerator", "extract_params_node");
      graph.addEdge("odooExecutor", "getCompleteInvoiceDetail");
      graph.addEdge("getCompleteInvoiceDetail", "pdfGenerator");

      graph.addConditionalEdges("extract_params_node", toolsLib.verifyParams);

      graph.addConditionalEdges("human_loop_node", toolsLib.verifyParams);
      // graph.addConditionalEdges("odooExecutor", toolsLib.getNextNode);

      if(inputs.state && inputs.state.lastExecutedNode){
        graph.setEntryPoint(inputs.state.lastExecutedNode);  
      }else{
        graph.setEntryPoint("setInvoiceGenerator");  
      }
      
      graph.setFinishPoint("human_loop_node");
      graph.setFinishPoint("pdfGenerator");
    }
    else if(inputs.id === "Odoo Agent"){
      
      graph.addNode("odooApiSelector", toolsLib.odooApiSelector);
      graph.addNode("select_api_node", toolsLib.selectApi);
      graph.addNode("extract_params_node", toolsLib.extractParameters);
      graph.addNode("human_loop_node", toolsLib.requestParameters);
      graph.addNode("odooExecutor", toolsLib.odooExecutor);
      graph.addNode("result_verifier", toolsLib.resultVerifier);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      // graph.addNode("nextActionDecisionMaker", toolsLib.nextActionDecisionMaker);

      graph.addEdge("odooApiSelector", "select_api_node");
      graph.addEdge("select_api_node", "extract_params_node");
      graph.addEdge("odooExecutor", "result_verifier");
      // graph.addEdge("result_verifier", "nextActionDecisionMaker");

      graph.addConditionalEdges("extract_params_node", toolsLib.verifyParams);

      graph.addConditionalEdges("human_loop_node", toolsLib.verifyParams);

      graph.addConditionalEdges("result_verifier", toolsLib.nextActionDecisionMaker);      



      if(inputs.state && inputs.state.lastExecutedNode){
        console.log(`Last Executed Node - ${inputs.state.lastExecutedNode}`)
        graph.setEntryPoint(inputs.state.lastExecutedNode);  
      }else{
        graph.setEntryPoint("odooApiSelector");  
      }
      
      graph.setFinishPoint("human_loop_node");
      graph.setFinishPoint("pdfGenerator");


    } else if(inputs.id === "Document Generator"){
      graph.addNode("sql_query_node", toolsLib.sql_lang_graph_db_query);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      graph.addEdge("sql_query_node", "pdfGenerator");
      graph.setEntryPoint("sql_query_node");
      graph.setFinishPoint("pdfGenerator");
    }else if(inputs.id === "Info Teller"){

      graph.addNode("document_retriever", toolsLib.document_retriever);
      // graph.addNode("response_formatter_node", toolsLib.responseFormatter);
      // graph.addEdge("document_retriever", "response_formatter_node");
      graph.setEntryPoint("document_retriever");
      graph.setFinishPoint("document_retriever");

    }else if(inputs.id === "Report Builder"){
      // graph.addNode("sql_query_node", toolsLib.sql_lang_graph_with_human_response);
      graph.addNode("sql_query_node", toolsLib.sql_lang_graph_db_query);
      graph.addNode("response_formatter_node", toolsLib.responseFormatter);
      graph.addEdge("sql_query_node", "response_formatter_node");
      graph.setEntryPoint("sql_query_node");
      graph.setFinishPoint("response_formatter_node");
    }else if(inputs.id === "Gmail Agent"){
      graph.addNode("gmail_agent", toolsLib.gmail_agent);
      graph.addNode("response_formatter_node", toolsLib.responseFormatter);
      graph.addEdge("gmail_agent", "response_formatter_node");
      graph.setEntryPoint("gmail_agent");
      graph.setFinishPoint("response_formatter_node");
    }else if(inputs.id === "Support Engineer"){
      // graph.addNode("extract_category_node", toolsLib.extractCategory);
      graph.addNode("get_apis_node", toolsLib.getApis);
      graph.addNode("select_api_node", toolsLib.selectApi);
      graph.addNode("extract_params_node", toolsLib.extractParameters);
      graph.addNode("human_loop_node", toolsLib.requestParameters);
      graph.addNode("execute_request_node", toolsLib.createFetchRequest);
      graph.addNode("response_formatter_node", toolsLib.responseFormatter);
      // graph.addEdge("extract_category_node", "get_apis_node");
      graph.addEdge("get_apis_node", "select_api_node");
      graph.addEdge("select_api_node", "extract_params_node");
      graph.addEdge("execute_request_node", "response_formatter_node");

      graph.addConditionalEdges("extract_params_node", toolsLib.verifyParams);

      graph.addConditionalEdges("human_loop_node", toolsLib.verifyParams);
      
      if(inputs.state && inputs.state.lastExecutedNode){
        console.log(`Last Executed Node - ${inputs.state.lastExecutedNode}`)
        graph.setEntryPoint(inputs.state.lastExecutedNode);  
      }else{
        // graph.setEntryPoint("extract_category_node");
        graph.setEntryPoint("get_apis_node");  
      }
      
      graph.setFinishPoint("human_loop_node");
      graph.setFinishPoint("response_formatter_node");
    }
    else{
      graph.addNode("document_retriever", toolsLib.document_retriever);
      // graph.addNode("response_formatter_node", toolsLib.responseFormatter);
      // graph.addEdge("document_retriever", "response_formatter_node");
      graph.setEntryPoint("document_retriever");
      graph.setFinishPoint("document_retriever");
    }
    

    const app = graph.compile();
    return exits.success(app);
  }
};

