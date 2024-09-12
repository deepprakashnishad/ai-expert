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
                prefix: z.string().optional(),
                productFilters: z.object({
                    available: z.boolean().default(true),
                    price: z.object({
                        max: z.number().optional(),
                        min: z.number().optional()
                    }),
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

    async _call(arg) {
        

        const productQuery = `
          query ProductQuery($handle: String) {
            product(handle: $handle) {
              id
              title
              handle
            }
          }
        `;
        const {data, errors, extensions} = await this.storefrontClient.request(productQuery, {
          variables: {
            handle: arg['query'],
          },
        });
        if(!errors){
            return JSON.stringify(data);    
        }else{
            return JSON.stringify(errors);
        }        
    }
}
 
module.exports = {SearchProductByQuery}; 