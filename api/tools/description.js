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

	mainOptions: 
		{
			"Common Agent": [
				{
					actionName: "ShopifyCancelOrder",
					displayName: "Cancel Order",
					type: "tool",
					actionType: "shopify",
					description: "Use this tool to cancel a shopify order",
					questions: [{
							ques: "Please provide the order number of the order to cancel",
							key: "orderId"
						}
					],
					closing: {
						"prompt": "Would you like to browse something?",
						"type": 'OptionFromServer',
						"options": [
							{
								actionName: "SearchProductByQuery",
								displayName: "Yes"
							},
							{
								actionName: "main_menu",
								displayName: "Go Back To Main Menu"
							}
						]
					}
				},
				/*{
					actionName: "GetCustomerOrders",
					displayName: "My Orders",
					type: "tool",
					actionType: "shopify",
					description: "Use this tool to get all or filtered customer orders",
					userPrompt: "Yes I will retrieve your orders",
					questions: [
						{
							"ques": "Do you wish to retrieve latest order or an specific order",
							"options": [
								{value: "latest", displayName: "Latest Order"},
								{
									displayName: "Specific Order",
									questions: [{
										ques: "Please provide the order number whose details have to be retrieved",
										key: "orderId"
									}]
								},
							]
						},
						{
							"ques": "Please provide your phone registered with shopify",
							"key": "customer_phone"
						}
					]
				},*/
				{
					actionName: "ShopifyGetOrderFulfillment",
					displayName: "Track Order",
					type: "tool",
					actionType: "shopify",
					description: "This tool can help you get fulfillment status of an order",
					userPrompt: "Sure we would love to help you",
					questions: [
						{
							ques: "Please provide the order number whose fulfillment details are needed",
							key: "orderId"
						}
					],
					closing: {
						"prompt": "What do you want to do next?",
						"type": 'OptionFromServer',
						"options": [
							{
								actionName: "SearchProductByQuery",
								displayName: "Browse Products"
							},
							{
								actionName: "main_menu",
								displayName: "Go Back To Main Menu"
							},
							{
								actionName: "ShopifyCancelOrder",
								displayName: "Cancel Order"
							}

						]
					}
				},
				{
					actionName: "SearchProductByQuery",
					displayName: "Search Product",
					type: "tool",
					actionType: "shopify",
					description: "This tool can fetch products by query",
					questions:[
						{
							"ques": "What can I search for you?",
							"type": 'text',
							"key": "userInput"
						}
					],
					closing: {
						"prompt": "Did you liked this? May I show you something else?",
						"type": 'OptionFromServer',
						"options": [
							{
								actionName: "SearchProductByQuery",
								displayName: "No, I did not like it."
							},
							{
								actionName: "main_menu",
								displayName: "Go Back To Main Menu"
							},
							{
								actionName: "ShopifyGetProductRecommendations",
								displayName: "Product Recommendations"	
							}
						]
					},
					timeoutAction: true
				},
				{
					actionName: "ShopifyGetRefunds",
					displayName: "Get Refund Details",
					type: "tool",
					actionType: "shopify",
					description: "Use this tool to retrieve refund details",
					userPrompt: "Sure we would love to help you",
					questions: [
						{
							ques: "Please provide the order number whose refund details are to be extracted",
							key: "orderId"
						}
					],
					closing: {
						"prompt": "Would you like to browse something?",
						"type": 'OptionFromServer',
						"options": [
							{
								actionName: "SearchProductByQuery",
								displayName: "Yes"
							},
							{
								actionName: "main_menu",
								displayName: "Go Back To Main Menu"
							}
						]
					}
				},
				{
					actionName: "GenericAnswerTool",
					displayName: "General Questions",
					type: "tool",
					actionType: "RAG",
					description: "This is a retrieval augmented tool and should always be used for generic queries. Use this to search general information matching to the related query pre-stored in database.",
					questions:[
						{
							"ques": "What do wish to know?",
							"type": 'text',
							"key": "userInput"
						}
					],
					closing: {
						"prompt": "Would you like to know anything else or would like to search some products to buy?",
						"type": 'OptionFromServer',
						"options": [
							{
								actionName: "SearchProductByQuery",
								displayName: "I wish to search product"
							},
							{
								actionName: "main_menu",
								displayName: "Go Back To Main Menu"
							},
							{
								actionName: "GenericAnswerTool",
								displayName: "Ask more query"	
							}
						]
					}
				}
			]
		},

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
			actionName: "main_menu",
			displayName: "Go back to main menu",
			type: "main_menu"
		},
		{
			actionName: "ShopifyGetProductRecommendations",
			displayName: "Related Products",
			type: "tool",
			actionType: "shopify",
			description: "Use this tool to get related products",
			toolInput: "{product_id: {PRODUCT_ID}, productSearchString: {PRODUCT_TITLE}}"
		},
		{
			actionName: "SearchProductByQuery",
			displayName: "Search Products",
			type: "tool",
			actionType: "shopify",
			description: "This tool can fetch products by query",
			questions:[
				{
					"ques": "What I should show you?",
					"type": 'text',
					"key": "userInput"
				}
			],
			closing: {
				"prompt": "Did you liked this? May I show you something else?",
				"type": 'OptionFromServer',
				"options": [
					{
						actionName: "SearchProductByQuery",
						displayName: "No, I did not like it."
					},
					{
						actionName: "main_menu",
						displayName: "Go Back To Main Menu"
					},
					{
						actionName: "AvailableCategories",
						displayName: "Available Categories"	
					}
				]
			}
		},
		{
			actionName: "ShopifyCancelOrder",
			displayName: "Cancel Order",
			type: "tool",
			actionType: "shopify",
			description: "Use this tool to cancel a shopify order",
			questions: [{
					ques: "Please provide the order number of the order to cancel",
					key: "orderId"
				}
			],
			closing: {
				"prompt": "Would you like to browse something?",
				"type": 'OptionFromServer',
				"options": [
					{
						actionName: "SearchProductByQuery",
						displayName: "Yes"
					},
					{
						actionName: "main_menu",
						displayName: "Go Back To Main Menu"
					}
				]
			}
		},
		{
			actionName: "GenericAnswerTool",
			displayName: "General Questions",
			type: "tool",
			actionType: "RAG",
			description: "This is a retrieval augmented tool and should always be used for generic queries. Use this to search general information matching to the related query pre-stored in database.",
			questions:[
				{
					"ques": "What do wish to know?",
					"type": 'text',
					"key": "userInput"
				}
			],
			closing: {
				"prompt": "Would you like to know anything else or would like to search some products to buy?",
				"type": 'OptionFromServer',
				"options": [
					{
						actionName: "SearchProductByQuery",
						displayName: "I wish to search product"
					},
					{
						actionName: "main_menu",
						displayName: "Go Back To Main Menu"
					},
					{
						actionName: "GenericAnswerTool",
						displayName: "Ask more query"	
					}
				]
			}
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
