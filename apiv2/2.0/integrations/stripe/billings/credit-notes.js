import Billings from './billings.js'

/* 	Endpoints 																		/*
 	Reference Docs: https://stripe.com/docs/api/credit_notes/object 				/*
																					/*
GET 	/v1/credit_notes/preview													/*
POST 	/v1/credit_notes															/*
GET 	/v1/credit_notes/:id														/*
POST 	/v1/credit_notes/:id														/*
GET 	/v1/credit_notes/:credit_note/lines											/*
GET 	/v1/credit_notes/preview/lines												/*
POST 	/v1/credit_notes/:id/void													/*
GET 	/v1/credit_notes															/*
																					*/																						

/*		Coding Style																/*
		------------

		The documentation, reference above, provides a menu of options.  We use this
		menu as a reference for naming conventions.  Additionally, the functions are
		implemented in the order they are documented, as the documentations exists as
		of 5/21/23

		Credit Notes																	https://stripe.com/docs/api/credit_notes
			- Preview a credit note					previewCreditNote					https://stripe.com/docs/api/credit_notes/preview
			- Create a credit note					createCreditNote					https://stripe.com/docs/api/credit_notes/create
			- Retrieve a credit note				retrieveCreditNote					https://stripe.com/docs/api/credit_notes/retrieve
			- Update a credit note					updateCreditNote					https://stripe.com/docs/api/credit_notes/update
			- Retrieve a credit note's line items	retrieveCreditNoteLineItems			https://stripe.com/docs/api/credit_notes/lines
			- Retrieve a credit notes preview's		retrieveCreditNotePreviewsLineItems https://stripe.com/docs/api/credit_notes/preview_lines
				line items
			- Void a credit note					voidCreditNote						https://stripe.com/docs/api/credit_notes/void
			- List All Credit Notes					listAllCreditNotes					https://stripe.com/docs/api/credit_notes/list
*/

export default class CreditNotes extends Billings {

  constructor(){
    super();
  }

  async previewCreditNote(id ="", linesArOpt =[]){

  }

  async createCreditNote(id ="", linesArOpt =[]){

  }

  async retrieveCreditNote(){

  }

  async updateCreditNote(){

  }

  async retrieveCreditNoteLineItems(){

  }

  async retrieveCreditNotePreviewsLineItems(){

  }

  async voidCreditNote(){

  }

  async listAllCreditNotes(){

  }

}