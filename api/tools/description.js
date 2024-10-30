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
			description: "Use this tool to cancel a shopify order",
			actionPrompt: "I want to cancel my order?",
		},
		{
			actionName: "GetCustomerOrders",
			displayName: "Get My Orders",
			type: "tool",
			actionType: "shopify",
			description: "Use this tool to get all or filtered customer orders",
			actionPrompt: "Please get me my last 3 orders"
		},
		{
			actionName: "ShopifyGetOrderFulfillment",
			displayName: "Get Order Fulfillment",
			type: "tool",
			actionType: "shopify",
			description: "This tool can help you get fulfillment status of an order",
			userPrompt: "Please provide order number whose fulfillment details are needed"
		},
		{
			actionName: "SearchProductByQuery",
			displayName: "Search Product",
			type: "tool",
			actionType: "shopify",
			description: "This tool can fetch products by query",
			userPrompt: "What do you wish to search today?"
		},
		{
			actionName: "ShopifyGetRefunds",
			displayName: "Get Refund Details",
			type: "tool",
			actionType: "shopify",
			description: "Use this tool to retrieve refund details",
			actionPrompt: "Please provide order number whose refund details are to be extracted",
		},
		{
			actionName: "GenericAnswerTool",
			displayName: "General Questions",
			type: "tool",
			actionType: "RAG",
			description: "This is a retrieval augmented tool and should always be used for generic queries. Use this to search general information matching to the related query pre-stored in database.",
			userPrompt: "What do you want to know?"
		},
		{
			actionName: "6687c69c802c0b4423a68909",
			displayName: "Quotation Generator",
			type: "customTool",
			actionType: "customTool",
			description: "Use this tool to generate quotations",
			userPrompt: "Please provide details of the quotations.",
			questions: []
		},
	],

	subOptions: [
		{
			actionName: "yes",
			displayName: "Yes",
			type: "input",
			actionPrompt: "Yes",
		},

		{
			actionName: "no",
			displayName: "No",
			type: "input",
			actionPrompt: "No"
		},
		{
			actionName: "ShopifyGetProductRecommendations",
			displayName: "Related Products",
			type: "tool",
			actionType: "shopify",
			description: "Use this tool to get related products",
			toolInput: "{product_id: {PRODUCT_ID}, productSearchString: {PRODUCT_TITLE}}"
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
