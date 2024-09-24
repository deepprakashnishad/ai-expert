const { z } = require("zod");
const { INVENTORY_TOOL } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class FetchInventory extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "fetch_inventory"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: INVENTORY_TOOL
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                limit: z.number().default(250),
                handle: z.string().optional(),
                product_type: z.string().optional(),
                status: z.enum(["active", "archived", "draft"]).default("active"),
                published_status: z.enum(["published", "unpublished", "any"]).default("published"),
                title: z.string().optional(),
                vendor: z.string().optional(),
                ids: z.string().array().optional(),
            })
        });
    }

    levenshtein(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1  // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    findClosestMatch(target, strings) {
        let exactMatchIndex = strings.findIndex(str => str === target);
        if (exactMatchIndex !== -1) {
            return exactMatchIndex; // Return the index of the exact match if found
        }

        // Find the closest match using Levenshtein distance
        let closestMatchIndex = -1;
        let closestDistance = Infinity;

        for (let i = 0; i < strings.length; i++) {
            const str = strings[i];
            const distance = this.levenshtein(target, str);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestMatchIndex = i; // Keep track of the index
            }
        }

        return closestMatchIndex; // Return the index of the closest match
    }

    extractInventoryDetails(product, type="storefront"){
        var temp = {};
        temp.productId = product.id;
        temp.title = product.title;
        temp.product_type = product.product_type || product.productType;
        temp.totalInventory = product.totalInventory
        if(type==="storefront"){
            temp['variants'] = product.variants.edges.map(ele=>{
                return {
                    id: ele.node.id,
                    quantityAvailable: ele.node.quantityAvailable,
                    title: ele.node.title,
                    sku: ele.node.sku,
                    availableForSale: ele.node.availableForSale
                }
            });
        }else{
            temp['variants'] = product.variants.map(ele=> {
                return {
                    id: ele.id,
                    title: ele.title,
                    sku: ele.sku,
                    quantityAvailable: ele.inventory_quantity,
                    inventory_item_id: ele.inventory_item_id
                }
            });    
        }
        return temp;
    }

    async _call(arg) {
        try{
            const response = await this.shopify.product.list(arg);
            if(response.length>0){
                var selectedProduct = response[0];
                if(arg['title']){
                    const prodTitleList = response.map(ele=>ele.title);
                    var closestIndex = this.findClosestMatch(arg['title'], prodTitleList);    
                    selectedProduct = response[closestIndex];
                }else if(arg['handle']){
                    if(response.length===0){
                        return `We are unable to find product with handle ${arg['handle']}`;
                    }
                    const prodTitleList = response.map(ele=>ele.handle);
                    var closestIndex = this.findClosestMatch(arg['handle'], prodTitleList);    
                    selectedProduct = response[closestIndex];
                }
                
                var product = this.extractInventoryDetails(selectedProduct);
                return JSON.stringify(product);            
            }else if(arg['title']){
                const productQuery = `
                query searchProducts($query: String!, $first: Int) {
                    search(query: $query, first: $first, types: PRODUCT) {
                      edges {
                        node {
                          ... on Product {
                            id
                            title
                            handle
                            productType
                            totalInventory
                            variants(first: 10) {
                            edges {
                                node {
                                    id
                                    title
                                    sku
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
                    query: arg['title'],
                    first: 50,
                  },
                });

                if(!errors){
                    if(data['search']['edges'].length===0){
                        return `We are unable to find product with title ${arg['title']}`;
                    }
                    const prodTitleList = data['search']['edges'].map(ele=>ele.node.title);
                    var closestIndex = this.findClosestMatch(arg['title'], prodTitleList);    
                    selectedProduct = data['search']['edges'][closestIndex];                    
                    var product = this.extractInventoryDetails(selectedProduct['node']);
                    return JSON.stringify(product);            
                }else{
                    console.log(errors);
                    return "Due to some technical issue we are unable to retrieve inventory details right now. Please try again later."
                }
            }
        }catch(ex){
            console.log(ex);
            return "Due to some technical issue we are unable to retrieve inventory details right now. Please try again later."
        }
        return undefined;
    }
    
}
 
module.exports = {FetchInventory}; 