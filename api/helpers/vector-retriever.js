module.exports = {


  friendlyName: 'Vector Retriever',


  description: 'Vector Retriver from database',


  inputs: {
    qEmbeddings:{
      type: "json",
      required: true
    },
    result_count: {
    	type: "number",
    	defaultsTo: 5
    },
    format: {
      type: "string",
      defaultsTo: "float"
    },
    userId: {
      type: "string"
    },
    matchFilter: {
      type: "json"
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
  	try{
      const cvectorColl = Cvector.getDatastore().manager.collection(Cvector.tableName);
      var mFilter = inputs.matchFilter;
      await cvectorColl.aggregate([
        {
          mFilter,

          "$vectorSearch": {
            "queryVector": inputs.qEmbeddings,
            "path": "e",
            "numCandidates": 100,
            "limit": inputs.result_count,
            "index": "cvectorIndex",
          }
        },
        {
          "$project": {
            "_id":0,
            "p": 0,
            "e": 0,
            "createdAt": 0,
            "updatedAt": 0,
            "score": { $meta: "vectorSearchScore" }
          }
        }
      ]).toArray(async(err, results)=>{
        console.log(results);
        var info = "";

        for(var result of results){
          info = info + "\n"+result.it;
        }
        var userQuestion = messages[messages.length-1]['content'];
        var mPrompt = `###${info}### '''${userQuestion}'''`;
        messages[messages.length-1]['content'] = mPrompt;
        console.log(messages);
        var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 256});
        console.log(result);
        // res.successResponse({data:messages}, 200, null, true, "Record found");
        res.successResponse({data:result}, 200, null, true, "Response from AI bot");
      });
  	}catch(e){
  		console.log(e);
  	}  	
  }
};

