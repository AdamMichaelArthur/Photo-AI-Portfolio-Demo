import Base from '../Base/base.js'
import btoa from 'btoa'
import atob from 'atob'
import { randomUUID } from 'crypto';
import * as util from "util";
import axios from 'axios';
import fs from 'fs/promises';

export default class Translate extends Base {
	async translate(langFrom, langTo, matrix) {
	    try {
	        const filename = `./classes/Translate/${langFrom}-${langTo}.json`;
	        const data = await fs.readFile(filename, 'utf8');
	        var translations = JSON.parse(data);
	        console.log(filename);
	    } catch (error) {
	        console.error('Error occurred:', error);
	    }

	    for(var obj of matrix){
	    	let str = obj.value;
	    	for (const key in translations) {
			    if (translations.hasOwnProperty(key)) {
			        if(key == str){
			        	obj.value = translations[key]
			        }
			    }
			}
	    	
	    }
	}
}