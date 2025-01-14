class GraphState {
  constructor(
      llm, 
      query, 
      chatId,
      selected_apis = [],
      next_node = null,
      categories = null, 
      apis = null, 
      bestApi = null, 
      params = {}, 
      response = null, 
      question = null,
      finalResult = null,
      conversation = [],
      lastExecutedNode = null,
      is_result_acceptable = null,
      prompt = null,
      tool = null,
      user = null,
      toolUsed = null,
      extraData = null
  ) {
    this.llm = llm;
    this.query = query;
    this.selected_apis = selected_apis;
    this.next_node = next_node;
    this.categories = categories;
    this.apis = apis;
    this.bestApi = bestApi;
    this.params = params;
    this.response = response;
    this.question = question;
    this.finalResult = finalResult;
    this.conversation=conversation;
    this.lastExecutedNode = lastExecutedNode;
    this.chatId = chatId;
    this.is_result_acceptable = is_result_acceptable;
    this.prompt = prompt;
    this.tool = tool;
    this.user = user;
    this.toolUsed = toolUsed;
    this.extraData = extraData;
  }
}

module.exports = GraphState;
