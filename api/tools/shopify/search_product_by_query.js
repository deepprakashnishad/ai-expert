const { z } = require("zod");
const { SEARCH_PRODUCT_BY_QUERY } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class SearchProductByQuery extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "search_product_by_query"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                query: z.string(),
                result_count: z.number().default(5),
                prefix: z.string().default(""),
                productFilters: z.object({
                    available: z.boolean().default(true),
                    price: z.object({
                        max: z.number().optional(),
                        min: z.number().optional()
                    }).optional(),
                    type: z.string().optional(),
                    tag: z.string().optional()
                }).optional()
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: SEARCH_PRODUCT_BY_QUERY
        });
    }

    extractProduct(products){
        var fProducts = [];
        for(var prod of products){
            var temp = {};
            temp['id'] = prod['id'];
            temp['title'] = prod['title'];
            temp['body_html'] = prod['body_html'];
            temp['vendor'] = prod['vendor'];
            temp['handle'] = prod['handle'];
            temp['product_url'] = `${this.baseUrl}products/${temp['handle']}`;
            temp['product_type'] = prod['product_type'];
            temp['status'] = prod['status'];
            temp['currency'] = prod['currency'] || "INR";
            temp['image'] = prod['image'] && prod['image']['src']? prod['image']['src']:undefined;

            fProducts.push(temp);
        }
        return fProducts;
    }

    async _call(arg) {
        
        if(arg['prefix']===""){
            delete arg['prefix']
        }
        const productQuery = `
        query searchProducts($query: String!, $first: Int) {
            search(query: $query, first: $first, types: PRODUCT) {
              edges {
                node {
                  ... on Product {
                    id
                    title
                    handle
                    descriptionHtml
                    productType
                    images(first: 1) {
                        edges {
                          node {
                            originalSrc
                            altText
                          }
                        }
                    }
                    variants(first: 1) {
                    edges {
                        node {
                            id
                            price {
                              amount
                              currencyCode
                            }
                            availableForSale
                            quantityAvailable
                          }
                        }
                    }
                  }
                }
              }
            }
        }`;
        const {data, errors, extensions} = await this.storefrontClient.request(productQuery, {
          variables: {
            query: arg['query'],
            first: arg['result_count'],
          },
        });
        if(!errors){
            const products = this.extractProduct(data);
            return JSON.stringify({"template_name": "product_list_template", "data": products});    
        }else{
            console.log(errors);
            return "Due to technical issue unable to fetch the results right now. Try again later.";
        }        
    }
}
 
module.exports = {SearchProductByQuery}; 