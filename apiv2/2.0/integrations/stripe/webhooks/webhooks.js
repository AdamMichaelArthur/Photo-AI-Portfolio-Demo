import { Stripe, Optional } from '../stripe.js'

/**
 * @fileoverview This module provides a Webhooks class, for interacting with Stripe's webhook endpoints.
 * For more info about Stripe's webhook endpoints, see {@link https://stripe.com/docs/api/webhook_endpoints}
 * 
 * Related guide: Setting up webhooks {@link https://stripe.com/docs/webhooks/setup}
 * The Webhook endpoint object: Webhook Object {@link https://stripe.com/docs/api/webhook_endpoints/object}
 */

/**
 * The Webhooks class is for interacting with Stripe's webhook endpoints.
 *
 * @extends Stripe
 */
export default class Webhooks extends Stripe {

  /**
   * Constructs a new instance of the Webhooks class.
   */
  constructor(){
    super();
  }

  /**
   * Creates a new webhook.
   * For a complete and updated list of valid enabled events, see {@link https://stripe.com/docs/api/webhook_endpoints/create}
   *
   * @param {string} callbackUrl - The URL to which the request for this webhook will be sent. This is a required parameter.
   * @param {Array<string>} [enabledEvents=['*']] - The list of events to enable for this webhook. If not specified, all events are enabled. This is a required parameter.
   * @throws {Error} If the `callbackUrl` or `enabledEvents` parameter is not provided.
   */
  async createWebhook(callbackUrl ="", enabledEvents =['*']){

  }

  /**
   * Retrieves the webhook endpoint with the given ID.
   *
   * @param {string} requiredParam webhookId - a webhook id.  A list of webhooks can be updated by calling listAllWebhookEndpoints
   * @throws {Error} The updated webhook endpoint object if successful. Otherwise, this call returns an error.
   */
  async retrieveWebhook(webhookId =""){

  }

  /**
   * Updates the webhook endpoint. You may edit the url, the list of enabled_events, and the status of your endpoint.
   *
   * @param {string} requiredParam webhookId - a webhook id.  A list of webhooks can be updated by calling listAllWebhookEndpoints
   * @param {string} [optionalParam='description']  - An optional description of what the webhook is used for.
   * @param {string[]} [enabled_events=['*']]
   * @param {string} [optionalParam='callbackUrl'] - The URL of the webhook endpoint.
   * @param {boolean} [optionalParam='disabled'] - A boolean flag to indicate whether the webhook is enabled
   * @throws {Error} The updated webhook endpoint object if successful. Otherwise, this call returns an error.
   */
  async updateWebhook(webhookId ="", enabled_events =Optional, description =Optional, callbackUrl =Optional, disabled =Optional){
  	let callback = {}
  	if(callbackUrl !== Optional){
  		callback["url"] = callbackUrl
  	}

  	if(disabled !== Optional){
  		callback["disabled"] = disabled
  	} else { callback["disabled"] = false; }


  	if(endpoint_events[0] !== '*'){
  		if(enabled_events.length > 0){
  			callback["enabled_events"] = enabled_events;
  		}
  	} else if (enabled_events === Optional) {
  		enabled_events = ['*'];
  		callback["enabled_events"] = enabled_events;
  	}

  	if(description !== Optional){
  		if(typeof description === "string"){
  			if(description.length > 0){
  				callback["description"] = description;		
  			}
  		}
  	}

	const webhookEndpoint = await stripe.webhookEndpoints.update(
	  webhookId,
	  callback
	);
  }

  /**
   * Returns a list of your webhook endpoints.
   * Reference: {@link https://stripe.com/docs/api/webhook_endpoints/list}
   *
   * @param {string} [optionalParam='ending_before'] -  A cursor for use in pagination. 
   * @param {number} [optionalParam='limit'] -  A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
   * @param {string} [optionalParam='starting_after'] - A cursor for use in pagination. 
   * @throws {Error} If there is a problem making the request
  */
  async listAllWebhookEndpoints(ending_before =Optional, limit =Optional, starting_after =Optional){
  	if(limit === Optional){
  		limit = 10;
  	}
	const webhookEndpoints = await stripe.webhookEndpoints.list({
	  limit: 3,
	});
  }

  /**
   * Deletes a webhook.
   * Reference: {@link https://stripe.com/docs/api/webhook_endpoints/delete}
   *
   * An object with the deleted webhook endpoints’s ID. Otherwise, this call returns an error, such as if the webhook endpoint has already been deleted.
  */
  async deleteWebook(webhookId =""){
	const deleted = await stripe.webhookEndpoints.del(
	  webhookId
	);
  }

}










