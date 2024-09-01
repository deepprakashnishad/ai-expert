const { z } = require("zod");
const { GET_REFUNDS } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyGetRefunds extends ShopifyBaseTool {

    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "get_refunds"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                orderId: z.number().optional(),
                customer_id: z.number().optional(),
                email: z.string().optional()
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_REFUNDS
        });
    }

    async _call(arg) {
        try{
            if(!arg['orderId']){
                if(!customer_id){
                    if(!email){
                        
                    }
                }
            }
            const response = await this.shopify.refund.list(arg['orderId']);
            return JSON.stringify(response);    
        }catch(ex){
            console.log(ex);
        }
        return undefined;
    }
}
 
module.exports = {ShopifyGetRefunds}; 