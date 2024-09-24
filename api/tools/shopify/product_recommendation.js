const { z } = require("zod");
const { PRODUCT_RECOMMENDATION_TOOL } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');
const axios = require('axios');

class ShopifyGetProductRecommendations extends ShopifyBaseTool {

    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "product_recommendation"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: PRODUCT_RECOMMENDATION_TOOL
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                limit: z.number().default(5),
                query: z.string(),
                product_id: z.number(),
                intent: z.enum(["related", "complementary"]).default("related"),
                published_status: z.enum(["published", "unpublished", "any"]).default("published")
            }).refine(data => data.query || data.product_id, {
                message: "Either 'query' or 'product_id' must be provided.",
            })
        });
    }

    extractProducts(products){
        var newProdList = [];
        for(var ele of products){
            var temp = {};
            temp['product_id'] = ele.id;
            temp['title'] = ele.title;
            temp['handle'] = ele.handle;
            temp['product_url'] = `${this.credentials.baseUrl}products/${ele['handle']}`;
            temp['description'] = ele.description;
            temp['type'] = ele.type;
            temp['price'] = ele.price/100;
            temp['currency'] = ele.currency||"INR";
            temp['tag_price'] = ele.price/100;
            temp['variants'] = [];
            for (var variant of ele.variants) {
                var tempVar = {};
                tempVar['id'] = variant['id'];
                tempVar['title'] = variant['title'];
                tempVar['name'] = variant['name'];
                tempVar['options'] = variant['options'];
                tempVar['price'] = variant['price'];
                tempVar['tag_price'] = variant['compare_at_price'];
                temp['variants'].push(tempVar);
            }
            temp['options'] = ele.options
            for(var mediaContent of ele.media){
                if(mediaContent.media_type === "image"){
                    temp['image'] = mediaContent.src;    
                    break;
                }    
            }

            newProdList.push(temp);
        }

        return newProdList;
    }

    async _call(arg) {
        if(!arg['product_id']){
            const productQuery = `
            query searchProducts($query: String!, $first: Int) {
                search(query: $query, first: $first, types: PRODUCT) {
                  edges {
                    node {
                      ... on Product {
                        id
                      }
                    }
                  }
                }
            }`;
            const {data, errors, extensions} = await this.storefrontClient.request(productQuery, {
              variables: {
                query: arg['query'],
                first: 1,
              },
            });
            if(!errors){
                if(data['search']['edges'].length>0){
                    arg['product_id'] = data['search']['edges'][0]['node']['id'].split('/').pop();;    
                }else{
                    return "I am unable to find any product as per your need";
                }
            }else{
                console.log(errors);
                return "Due to technical issue unable to fetch the results right now. Try again later.";
            }        
        }

        const apiUrl = `${this.credentials.baseUrl}recommendations/products.json?product_id=${arg['product_id']}&limit=${arg['limit']}&intent=${arg['intent']}`;
        try {
            const response = await axios.get(apiUrl);
            const products = this.extractProducts(response.data.products);
            console.log(products);
            return JSON.stringify(products);
        } catch (error) {
            console.log(error);
            return "Due to a technical issue I cannot recommend any product right now. Please try again later"; // Rethrow or handle the error as needed
        }
        return "Due to a technical issue I cannot recommend any product right now. Please try again later"; // Rethrow or handle the error as needed
    }
}
 
module.exports = {ShopifyGetProductRecommendations}; 