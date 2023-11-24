import { Base, ResponseError } from '@base'

export default class Slack extends Base {

	required_scopes = ['incoming-webhook','commands','chat:write','channels:history','groups:history','im:history','mpim:history','incoming-webhook'];

  constructor(){
    super();

  }

  getAuthenticationUrl(){
    let state = this.user._id;
    let authorizeUrl = `https://slack.com/oauth/v2/authorize?state=${state}&redirect_uri=https://app.saas-product.com/v2.0/public/callbacks/slack/authorized&scope=${this.required_scopes.toString()}&client_id=${process.env.SLACK_APP_CLIENT_ID}`;
  	this.response.reply(authorizeUrl);
  }
}




