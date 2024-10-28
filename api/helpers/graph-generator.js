const { END, StateGraph }  = require("@langchain/langgraph");

const toolsLib = require("./../tools");
const {toolExecutor, actionExecutor, agentSelector, actionParamsVerifier, actionInitializer, requestParams} = require("./../tools/tool-executor.js");

module.exports = {


  friendlyName: 'GraphGenerator',


  description: 'Generate Langchain graph',


  inputs: {
    id:{
      type: "string",
      defaultsTo: ""
    },
    chatId: {
      type: "string"
    },
    state: {
      type: "json",
      defaultsTo: null
    },
    action: {
      type: "json"
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
    if(inputs.id.toLowerCase() === "Common Agent1"){
      graph.addNode("agentSelector", agentSelector);
      graph.addNode("actionInitializer", async (context) => {
        var params = context.params || {};
        var user_query = context.conversation[context.conversation.length-1]['content'];
        /*if(inputs.action.data && inputs.action.data['user_query']){
          user_query = inputs.action.data['user_query'];
        }else{
          user_query = inputs.action.conversation[0]['content'];
        }*/
        params['chatId'] = context.chatId;
        params['userQuery'] = user_query;
        params['appId'] = context['user']['appId'];
        params['conversation'] = context.conversation;
        Object.assign(params, inputs.action.data);
        context.extraData = {   
          action: inputs.action, // function, tool, api, decision
        }; // Add extra data here
        context.params = params;
        return await actionInitializer(context); // Call the async function
      });
      /*graph.addNode("actionParamsVerifier", async (context) => {
        context.extraData = {   
          action: inputs.action, // function, tool, api, decision
        }; // Add extra data here
        return await actionParamsVerifier(context); // Call the async function
      });*/

      graph.addNode("requestParams", async (context) => {
        context.extraData = {   
          action: inputs.action, // function, tool, api, decision
        }; // Add extra data here
        return await requestParams(context); // Call the async function
      });
      graph.addNode("extract_params_node", toolsLib.extractParameters);

      graph.addNode("actionExecutor", async (context) => {

        if(inputs.action.type==="react-agent"){
          if(inputs.action.actionName==="GenericAnswerTool"){
            var user_query = context.conversation[context.conversation.length-1]['content'];
            /*if(inputs.action.data && inputs.action.data['user_query']){
              user_query = inputs.action.data['user_query'];
            }else{
              user_query = inputs.action.conversation[0]['content'];
            }*/
            context.prompt = `
              Use the given tools to answer user_query.
              {
                user_query: ${user_query},
                appId: ${context.user.appId || context.params.appId},
                conversation: ${JSON.stringify(context.conversation)}
              }
            `;
          }else{
            context.prompt = `Use the given tools to solve users query
              {
                user_query: ${user_query},
                appId: ${context.user.appId},
                params: ${JSON.stringify(context.params)}
              }
            `;
          }          
        }else if(inputs.action.type==="tool"){

        }
        context.extraData = {   
          action: inputs.action, // function, tool, api, decision
        }; // Add extra data here
        return await actionExecutor(context); // Call the async function
      });
      graph.addNode("response_formatter_node", toolsLib.responseFormatter);

      graph.addEdge("actionInitializer", "extract_params_node");
      graph.addEdge("actionExecutor", "response_formatter_node");

      // graph.addConditionalEdges("actionInitializer", actionParamsVerifier);
      graph.addConditionalEdges("extract_params_node", actionParamsVerifier);
      
      if(inputs.action){
        graph.setEntryPoint("actionInitializer");    
      }else{
        graph.setEntryPoint("agentSelector");    
      }
      graph.setFinishPoint("requestParams");
      graph.setFinishPoint("response_formatter_node");  
      graph.setFinishPoint("agentSelector"); 
    }
    else if(inputs.id.toLowerCase() === "shopify"){
      graph.addNode("flowDecisionMaker", toolsLib.flowDecisionMaker);
      // graph.addNode("getShopifyCustomerDetails", toolsLib.getShopifyCustomerDetails);
      graph.addNode("shopifyAgent", toolsLib.shopifyAgent);
      graph.addNode("retrieval_augmented_generation", toolsLib.document_retriever);
      // graph.addNode("shopifyAgent", toolsLib.customShopifyAgent);
      graph.addNode("response_formatter_node", toolsLib.responseFormatter);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      // graph.addNode("addActionButtons", toolsLib.addActionButtons);

      // graph.addEdge("getShopifyCustomerDetails", "shopifyAgent");
      graph.addEdge("shopifyAgent", "response_formatter_node");

      // graph.addConditionalEdges("getShopifyCustomerDetails", toolsLib.flowDecisionMaker);
      graph.addConditionalEdges("flowDecisionMaker", toolsLib.isNextNode);
      graph.addConditionalEdges("response_formatter_node", toolsLib.isNextNode);
      graph.setEntryPoint("flowDecisionMaker"); 
      graph.setFinishPoint("pdfGenerator"); 
      graph.setFinishPoint("retrieval_augmented_generation"); 
      // graph.setFinishPoint("addActionButtons"); 

      
      /*graph.addNode("getShopifyCustomerDetails", toolsLib.getShopifyCustomerDetails);
      // graph.addNode("shopifyAgent", toolsLib.shopifyAgent);
      graph.addNode("shopifyAgent", toolsLib.customShopifyAgent);
      graph.addNode("response_formatter_node", toolsLib.responseFormatter);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      // graph.addNode("addActionButtons", toolsLib.addActionButtons);

      graph.addEdge("getShopifyCustomerDetails", "shopifyAgent");
      graph.addEdge("shopifyAgent", "response_formatter_node");
      graph.addConditionalEdges("response_formatter_node", toolsLib.isNextNode);
      graph.setEntryPoint("getShopifyCustomerDetails"); 
      graph.setFinishPoint("pdfGenerator"); 
      // graph.setFinishPoint("addActionButtons"); */
    }
    else if(inputs.id === "Odoo Invoice Generator"){
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
      graph.addNode("odooAgent", toolsLib.odooAgent);
      // graph.addNode("odooApiSelector", toolsLib.odooApiSelector);
      // graph.addNode("select_api_node", toolsLib.selectApi);
      graph.addNode("extract_params_node", toolsLib.extractParameters);
      graph.addNode("human_loop_node", toolsLib.requestParameters);
      graph.addNode("odooExecutor", toolsLib.odooExecutor);
      graph.addNode("result_verifier", toolsLib.resultVerifier);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      // graph.addNode("nextActionDecisionMaker", toolsLib.nextActionDecisionMaker);

      graph.addEdge("odooAgent", "odooExecutor");
      // graph.addEdge("select_api_node", "extract_params_node");
      // graph.addEdge("odooExecutor", "result_verifier");
      // graph.addEdge("result_verifier", "nextActionDecisionMaker");

      graph.addConditionalEdges("extract_params_node", toolsLib.verifyParams);

      graph.addConditionalEdges("human_loop_node", toolsLib.verifyParams);

      graph.addConditionalEdges("result_verifier", toolsLib.nextActionDecisionMaker);      



      if(inputs.state && inputs.state.lastExecutedNode){
        console.log(`Last Executed Node - ${inputs.state.lastExecutedNode}`)
        graph.setEntryPoint(inputs.state.lastExecutedNode);  
      }else{
        graph.setEntryPoint("odooAgent");  
      }
      graph.setFinishPoint("odooExecutor");
      graph.setFinishPoint("human_loop_node");
      graph.setFinishPoint("pdfGenerator");
    } 

    else if(inputs.id === "Document Generator"){
      graph.addNode("sql_query_node", toolsLib.sql_lang_graph_db_query);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      graph.addEdge("sql_query_node", "pdfGenerator");
      graph.setEntryPoint("sql_query_node");
      graph.setFinishPoint("pdfGenerator");
    }

    /*else if(inputs.id === "Invoice Generator"){
      graph.addNode("invoice_generator", toolsLib.invoice_generator);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      graph.addEdge("invoice_generator", "pdfGenerator");
      graph.setEntryPoint("invoice_generator");
      graph.setFinishPoint("pdfGenerator");
    }*/
    else if(inputs.id === "Research & Mailer"){
      graph.addNode("llmSearch", async (context) => {
        var {conversation} = context;
        var userQuery = conversation[conversation.length-1]['content'];
        context.extraData = {   
          actionName: "openAI",
          type: "llm",
          actionCat: "llm",
          prompt: `Analyze the user query and prepare recipients, content and subject for the email. 
                  {user_query: ${userQuery}}
                  Your response must be in json format as follows
                  {to: recipient_list, content: "content_of_email", subject: "subject_line"}`,
          actionType: "llm" // function, tool, api, decision
        }; // Add extra data here
        return await toolExecutor(context); // Call the async function
      });
      graph.addNode("gmailSender", 
        async (context) => {
          const {params, user} = context;
          context.extraData = { 
            actionName: "MyGmailSendMessage",
            actionCat: "google",
            type: "tool",
            actionType: "react-agent",
            prompt: `Send email
                    {subject: ${params['subject']}, body: ${params['content']}, recipients: ${params['to']}, appId: ${user['appId']}}
                    Output must  in following format
                    {
                      mail_sent: "true/false",
                      message: "User friendly message"
                    }`
          }; // Add extra data here
          return await toolExecutor(context); // Call the async function
        }
      )

      graph.addEdge("llmSearch", "gmailSender");
      graph.setEntryPoint("llmSearch");
      graph.setFinishPoint("gmailSender");
    }
    else if(inputs.id === "Quotation Generator" || inputs.id === "Invoice Generator"){
      graph.addNode("quotation_generator", toolsLib.quotation_generator);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      graph.addEdge("quotation_generator", "pdfGenerator");
      graph.setEntryPoint("quotation_generator");
      graph.setFinishPoint("pdfGenerator");
    }
    else if(inputs.id === "Info Teller"){

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
    else if(inputs.id === "Common Agent"){
      graph.addNode("agentSelector", agentSelector);
      graph.addNode("actionInitializer", async (context) => {
        var params = context.params || {};
        var user_query = context.conversation[context.conversation.length-1]['content'];
        /*if(inputs.action.data && inputs.action.data['user_query']){
          user_query = inputs.action.data['user_query'];
        }else{
          user_query = inputs.action.conversation[0]['content'];
        }*/
        params['chatId'] = context.chatId;
        params['userQuery'] = user_query;
        params['appId'] = context['user']['appId'];
        params['conversation'] = context.conversation;
        Object.assign(params, inputs.action.data);
        context.extraData = {   
          action: inputs.action, // function, tool, api, decision
        }; // Add extra data here
        context.params = params;
        return await actionInitializer(context); // Call the async function
      });
      /*graph.addNode("actionParamsVerifier", async (context) => {
        context.extraData = {   
          action: inputs.action, // function, tool, api, decision
        }; // Add extra data here
        return await actionParamsVerifier(context); // Call the async function
      });*/

      graph.addNode("requestParams", async (context) => {
        context.extraData = {   
          action: inputs.action, // function, tool, api, decision
        }; // Add extra data here
        return await requestParams(context); // Call the async function
      });
      graph.addNode("extract_params_node", toolsLib.extractParameters);

      graph.addNode("actionExecutor", async (context) => {

        if(inputs.action.type==="react-agent"){
          if(inputs.action.actionName==="GenericAnswerTool"){
            var user_query = context.conversation[context.conversation.length-1]['content'];
            /*if(inputs.action.data && inputs.action.data['user_query']){
              user_query = inputs.action.data['user_query'];
            }else{
              user_query = inputs.action.conversation[0]['content'];
            }*/
            context.prompt = `
              Use the given tools to answer user_query.
              {
                user_query: ${user_query},
                appId: ${context.user.appId || context.params.appId},
                conversation: ${JSON.stringify(context.conversation)}
              }
            `;
          }else{
            context.prompt = `Use the given tools to solve users query
              {
                user_query: ${user_query},
                appId: ${context.user.appId},
                params: ${JSON.stringify(context.params)}
              }
            `;
          }          
        }else if(inputs.action.type==="tool"){

        }
        context.extraData = {   
          action: inputs.action, // function, tool, api, decision
        }; // Add extra data here
        return await actionExecutor(context); // Call the async function
      });
      graph.addNode("response_formatter_node", toolsLib.responseFormatter);

      graph.addEdge("actionInitializer", "extract_params_node");
      graph.addEdge("actionExecutor", "response_formatter_node");

      // graph.addConditionalEdges("actionInitializer", actionParamsVerifier);
      graph.addConditionalEdges("extract_params_node", actionParamsVerifier);
      
      if(inputs.action){
        graph.setEntryPoint("actionInitializer");    
      }else{
        graph.setEntryPoint("agentSelector");    
      }
      graph.setFinishPoint("requestParams");
      graph.setFinishPoint("response_formatter_node");  
      graph.setFinishPoint("agentSelector");
    }
    else{
      graph.addNode("flowDecisionMaker", toolsLib.flowDecisionMaker);
      // graph.addNode("getShopifyCustomerDetails", toolsLib.getShopifyCustomerDetails);
      graph.addNode("shopifyAgent", toolsLib.shopifyAgent);
      graph.addNode("retrieval_augmented_generation", toolsLib.document_retriever);
      // graph.addNode("shopifyAgent", toolsLib.customShopifyAgent);
      graph.addNode("response_formatter_node", toolsLib.responseFormatter);
      graph.addNode("pdfGenerator", toolsLib.pdfGenerator);
      // graph.addNode("addActionButtons", toolsLib.addActionButtons);

      // graph.addEdge("getShopifyCustomerDetails", "shopifyAgent");
      graph.addEdge("shopifyAgent", "response_formatter_node");

      // graph.addConditionalEdges("getShopifyCustomerDetails", toolsLib.flowDecisionMaker);
      graph.addConditionalEdges("flowDecisionMaker", toolsLib.isNextNode);
      graph.addConditionalEdges("response_formatter_node", toolsLib.isNextNode);
      graph.setEntryPoint("flowDecisionMaker"); 
      graph.setFinishPoint("pdfGenerator"); 
      graph.setFinishPoint("retrieval_augmented_generation"); 
      // graph.setFinishPoint("addActionButtons"); 
    }
    

    const app = graph.compile();
    return exits.success(app);
  }
};

