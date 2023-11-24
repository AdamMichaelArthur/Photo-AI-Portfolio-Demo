import { Base, ResponseError } from '@base'
import Google from '../google.js'



export default class Search extends Google {

  constructor(){
    super();
  }

  async test(str ='', num =0, bVar =false, opt =0){
    this.response.reply("works");
    return true;
  }

}