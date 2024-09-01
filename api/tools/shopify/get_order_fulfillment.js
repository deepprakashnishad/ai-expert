const { z } = require("zod");
const { GET_ORDER_FULFILLMENT } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyGetOrderFulfillment extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "get_order_fulfillment"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                order_id: z.number()
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_ORDER_FULFILLMENT
        });
    }

    extractOrders(orders){
        var fOrders = [];
        for(var order of orders){
            var temp = {};
            temp["contact_email"] = order['contact_email'];
            temp['created_at'] = order['created_at'];
            temp['currency'] = order['currency'];
            temp['subtotal_price'] = order['current_subtotal_price'];
            temp['total_additional_fees_set'] = order['current_total_additional_fees_set'];
            temp['total_discounts'] = order['current_total_discounts'];
            temp['total_price'] = order['current_total_price'];
            temp['total_tax'] = order['current_total_tax'];
            temp['discount_codes'] = order['discount_codes'];
            temp['email'] = order['email'];
            temp['financial_status'] = order['financial_status'];
            temp['fulfillment_status'] = order['fulfillment_status'];
            temp['order_number'] = order['order_number'];
            temp['order_status_url'] = order['order_status_url'];
            temp['phone'] = order['phone'];
            temp['tax_lines'] = order['tax_lines'];
            temp['billing_address'] = order['billing_address'];
            temp['line_items'] = order['line_items'];
            temp['shipping_address'] = order['shipping_address'];
            fOrders.push(temp);
        }
        return fOrders;
    }

    async _call(arg) {
        var response;
        try{
            response = await shopify.order.fulfillmentOrders(arg['order_id']);
            // response = await this.shopify.fulfillment.list(arg['order_id']);
            // const fulfillment = this.extractOrders(response);
            return JSON.stringify(response);    
        }catch(e){
            console.log(e)
        }
        return undefined;
    }
}
 
module.exports = {ShopifyGetOrderFulfillment}; 