module.exports = {
  attributes: {
  	title: {type: "string", required: true},
    nodes: {
      type: "json",
      defaultsTo: [] //Array of label and functionName json [{label, functionName}]
    },
    entryNode: {
      type: "string" //Label of entry node
    },
    exitNodes: { // Array of labels of stop nodes
      type: "json",
      required: true
    },
    edges: { // Array edges flowing from one node to another without any condition
      type: "json",
      required: true
    },
    conditionalEdges: {
      type: "json",
      required: true 
    }
  },
};