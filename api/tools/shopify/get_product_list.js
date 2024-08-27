const { z } = require("zod");
const { GET_SOPIFY_PRODUCT_LIST_DESCRIPTION } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyGetProducts extends ShopifyBaseTool {

    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "retrieve_shopify_products"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                limit: z.number().default(10),
                product_type: z.string().optional(),
                status: z.enum(["active", "archived", "draft"]).default("active"),
                published_status: z.enum(["published", "unpublished", "any"]).default("published"),
                title: z.string().optional(),
                vendor: z.string().optional(),
                ids: z.string().array().optional(),
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_SOPIFY_PRODUCT_LIST_DESCRIPTION
        });
    }

    async _call(arg) {
        try{
            const response = await this.shopify.product.list(arg);
            console.log(response);
            return JSON.stringify(response);    
        }catch(ex){
            console.log(ex);
        }
        return undefined;
    }
}
 
module.exports = {ShopifyGetProducts}; 