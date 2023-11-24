import { Base, ResponseError } from '@base'
import { URL } from 'url';
import zlib from 'zlib';

export default class Affiliates extends Base {

	constructor(){
		super();
	}

	/* We support several different methods of affiliate tracking.  Links are for emails, social media, shoutouts, etc. */
	link(){
		let queryParams = this.req.query;
		console.log(13, queryParams);

		let redirect = queryParams.redirect;
		let referer = queryParams.referer;

		const decodedRedirect = decodeURIComponent(redirect);
		const decodedRefererRootDomain = this.getRootDomain(decodeURI(referer));
		const primary_domain = process.env.PRIMARY_DOMAIN || '';

		this.res.cookie('affiliate-referral', decodedRefererRootDomain, { domain: `.${primary_domain}` } );
		this.res.redirect(decodedRedirect);

	}

	getLink(){
		let referer = this.getRootDomain(this.body.referer);
		let redirect = encodeURIComponent(this.body.redirect);
		let ref = encodeURIComponent(referer);
		let link = process.env.PRIMARY_LINK + process.env.API_PREFIX + `public/affiliates/link/?referer=${ref}&redirect=${redirect}`;
		this.response.reply(link)
	}

	/* To set a cookie, use Javascript to call /public/affiliates/track */
	track(){
		
		let req = this.req;

		this.res.cookie('test');

		const referer = req.headers.referer || req.headers.referrer || req.headers.Referer || req.headers.Referrer || 'none';

		/* First, check and see if we already have a cookie */
		const bHasReferralCookie = Boolean(this.req.cookies['affiliate-referral'] || false);

		if (bHasReferralCookie) {
		    return; // If the cookie exists, do nothing and return
		}

		if(referer == ''){
			return; // We don't have a referer, so we'll end here.
		}

		try {
			var rootDomain = this.getRootDomain(referer);
		} catch(err){
			// We were unable to parse the domain.  We really shouldn't get here, but if we do, there's something unusual
			// or non-standard about the header -- so we do nothing. 
			return;
		}

		const primary_domain = process.env.PRIMARY_DOMAIN || '';

		// We don't want to set a cookie when we're traversing our own sites
		if(referer.indexOf(primary_domain) !== -1){
			// We're trying to set a referral cookie from one of our own sites.  That's not do that.|
			return;
		}

		// An extra test just in case our configuration is off
		var ourDoamin = this.getRootDomain(primary_domain);
		if(referer.indexOf(ourDoamin) !== -1){
			return;
		}

		this.res.cookie('affiliate-referral', rootDomain, { domain: `.${primary_domain}` } );
	}


	getRootDomain(urlString) {
		  let hostname = '';
		  try {
		    const parsedUrl = new URL(urlString);
		    hostname = parsedUrl.hostname;
		  } catch (error) {
		    const match = urlString.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
		    if (match) {
		      hostname = match[1];
		    } else {
		      return this.getRootDomain('https://' + urlString);	
		    }
		  }

		  const parts = hostname.split('.').reverse();

		  // Check if there is a subdomain
		  if (parts.length > 2) {
		    return parts[1] + '.' + parts[0];
		  }
		  return hostname;
	}
}