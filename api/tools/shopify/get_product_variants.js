const { z } = require("zod");
const { GET_PRODUCT_VARIANTS } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyGetProductVariants extends ShopifyBaseTool {

    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "shopify_get_product_variants"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                productId: z.number()
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_PRODUCT_VARIANTS
        });
    }

    async _call(arg) {
        try{
            const response = await this.shopify.order.cancel(arg['productId']);
            return JSON.stringify(response);    
        }catch(ex){
            console.log(ex);
        }
        return undefined;
    }
}
 
module.exports = {ShopifyGetProductVariants}; 