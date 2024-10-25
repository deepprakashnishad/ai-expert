module.exports = {
	paths :[
		{
			name: "retrieval_augmented_generation",
			description: "This tool can help you generate answers based on pre-stored information. Use this tool when generic business related question is asked. Question is not specific to a person but will be common to many"
		},
		{
			name: "shopifyAgent",
			description: "Choose this to make api calls of shopify. To retrieve any specific information related to a customer, his related orders, refund details of a specific order, search products, get product details, product list  etc."	
		}
	],

	mainOptions: [
		{
			actionName: "ShopifyCancelOrder",
			displayName: "Cancel Order",
			type: "tool",
			actionType: "shopify",
			description: "Use this tool to cancel a shopify order"
		},
		{
			actionName: "GetCustomerOrders",
			displayName: "Orders",
			type: "tool",
			actionType: "shopify",
			description: "Use this tool to get all or filtered customer orders"
		},
		{
			actionName: "ShopifyGetOrderFulfillment",
			displayName: "Get Order Fulfillment",
			type: "tool",
			actionType: "shopify",
			description: "This tool can help you get fulfillment status of an order"
		},
		{
			actionName: "SearchProductByQuery",
			displayName: "Search Product",
			type: "react-agent",
			actionType: "shopify",
			description: "This tool can fetch products by query"
		},
		{
			actionName: "ShopifyGetRefunds",
			displayName: "Get Refund Details",
			type: "tool",
			actionType: "shopify",
			description: "Use this tool to retrieve refund details"
		},
		{
			actionName: "GenericAnswerTool",
			displayName: "General Questions",
			type: "tool",
			actionType: "RAG",
			description: "This is a retrieval augmented tool and should always be used for generic queries. Use this to search general information matching to the related query pre-stored in database.",
			actionPrompt: "What do you want to know?",
			questions: [
				{
					key: "user_query",
					ques: "What do you want to know?"
				}
			]
		}
	],

	/*{
		name: "shopify.get_customer_detail",
		description: "Use this tool to retrieve customer details"
	},
	{
		name: "shopify.get_customer_list",
		description: "Use this tool retrieve list of customers"
	},
	{
		name: "shopify.get_inventory",
		description: "This tool can retrieve inventory"
	},
	{
		name: "shopify.product_recommendation",
		description: "This tool can fetch related and complimentary products to a given product"
	},*/
	SEND_EMAIL_DESC: "This tool should be used for sending one or more email"
} 	
