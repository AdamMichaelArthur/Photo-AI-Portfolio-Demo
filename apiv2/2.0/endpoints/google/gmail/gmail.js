import { Base, ResponseError } from '@base'
import Google from '../google.js'

export default class Gmail extends Google {

  constructor(){
    super();
  }

  async authorize() {

  	let redirectUrl = await this.integrations.google.gmail.getAuthorizationUrl(this.user._id) 
  	this.response.reply({ "redirect_uri": redirectUrl } );

	}

	async authorized(){
		return true;
	}

  async getProfile(){

    let token = {
    access_token: 'ya29.a0AWY7CkmZ-jLeyyh1YDM5vE3mBaRD_mT8sNUK9AaGcmkBs7xo6FFSOTukQPKESnBVwBJwwykEIW91TKemEh_01TIsWLMIY1g46uZW3VKQKD9VVgVGLs4xlhPSeMG06e2boQekNGx3Tgs_ReBcMnqztt8w8toVaCgYKAfYSARASFQG1tDrp68x35k8VMyRVq6Ad_gmXbA0163',
    refresh_token: '1//090GVhgq7klcKCgYIARAAGAkSNwF-L9IrjbMOhvkEWj57IVJ14YMAn5AN7_J56nGZcUOAqG-QRrH28aQ8oVI_Co_glZy_e8BdkIc',
    scope: 'openid https://mail.google.com/ https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email',
    token_type: 'Bearer',
    id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1MTUwYTEzMjBiOTM5NWIwNTcxNjg3NzM3NjkyODUwOWJhYjQ0YWMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI4OTE3ODUxNTgwODgtazV1aGFwYnR1bXVkMjc5M3NsN24wN3Bsb2NwZWxobmouYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI4OTE3ODUxNTgwODgtazV1aGFwYnR1bXVkMjc5M3NsN24wN3Bsb2NwZWxobmouYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDY5OTc0NDU0NjkzNjEwMDExMTEiLCJlbWFpbCI6ImFkYW1hcnRodXJzYW5kaWVnb0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6InI4ODlHakY4N1NjRHFKTnlmaWE4TXciLCJpYXQiOjE2ODcwMDk4MTEsImV4cCI6MTY4NzAxMzQxMX0.wmD-lXxxUZOvLjNY3gTzKJZImOiwTnE79Hhv3F4515hMx8iYxQvvs3x3L8BKCHg79V1HzbyHUXwAHnChwCkAlf1V4RUiicVaWedimu7bh8U3Z289v7ZsDEHR5m5u2RBReBc6EKfVve4EryGS55s_NzSF5PAhZX1itGB_ksxdOu9xupY6zui_CS3DihG7izSPJ2UoNygP4MW-vrCs0dEi-h6ANOHTwGhyLjPHp8pvhZ6e_jiDgPzWcFkC7B3_IpkqIRFlLIUVLBL0r74kH_J1RVeUYTwg5fR_62I9kozVEIvVMNk-soxhqQk98O4_CKYaEJC2hYMUIHz9USxunz5iGQ',
    expiry_date: 1687013410914,
  }

    console.log(37, await this.integrations.google.gmail.getProfile(token));

    try {
      var profile = await this.integrations.google.gmail.getProfile(token);
    } catch(err){
      console.log(40, err);
    }

    this.response.reply(profile)

  }
}