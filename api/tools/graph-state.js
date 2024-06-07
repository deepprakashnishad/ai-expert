class GraphState {
  constructor(
      llm, 
      query, 
      chatId,
      categories = null, 
      apis = null, 
      bestApi = null, 
      params = null, 
      response = null, 
      question = null,
      lastExecutedNode = null
  ) {
    this.llm = llm;
    this.query = query;
    this.categories = categories;
    this.apis = apis;
    this.bestApi = bestApi;
    this.params = params;
    this.response = response;
    this.question = question;
    this.lastExecutedNode = lastExecutedNode;
    this.chatId = chatId;
  }
}

module.exports = GraphState;
