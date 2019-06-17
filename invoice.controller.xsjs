var XSDS = $.import("sap.hana.xs.libs.dbutils", "xsds");
var invoiceLogger = $.import('../libs/invoice-logger.xsjslib');

var processedInvoices = XSDS.$importEntity("coms.deloitte.apps.invoiceprocessor", "Invoices.ProcessedInvoices");
var extractedInvoices = XSDS.$importEntity("coms.deloitte.apps.invoiceprocessor", "Invoices.ExtractedInvoices");
var invoiceExceptions = XSDS.$importEntity("coms.deloitte.apps.invoiceprocessor", "Invoices.InvoiceExceptions");
var workflowExceptions = XSDS.$importEntity("coms.deloitte.apps.invoiceprocessor", "Invoices.InvoiceWorkflowException");
var InvoiceDisplayWorkflows = XSDS.$importEntity("coms.deloitte.apps.invoiceprocessor", "Invoices.InvoiceDisplayWorkflow");

var invoiceStatus = {};

function initializeInvoiceStatusHash(){

	// Initialize the multiple statuses with their corresponding text
	invoiceStatus.scanned = "Scanned";
	invoiceStatus.inProgress = "In_Progress";
	invoiceStatus.pendingApproval = "Pending_Approval";
	invoiceStatus.sentBackForReview = "Sent_Back_for_Review";
	invoiceStatus.approved = "Approved";
	invoiceStatus.posted = "Posted";

}

// Initialize the invoice status object everytime the lib is loaded
initializeInvoiceStatusHash();

function createDateFormat(dt){
//return ( dt.getMonth() + 1 ) + "-" + dt.getDate() + "-" + dt.getFullYear();
    return dt.getFullYear() + "-" + ( dt.getMonth() + 1 ) + "-" + dt.getDate();
}
function getCurrentDate(){
	var currentDate = new Date(Date.now());
	return createDateFormat(currentDate);
}


function getCurrentTS(){
	return new Date().toUTCString();
}

function readInvoice(invoiceGUID){

	try{

		var invoiceItems = processedInvoices.$query().$defaultProject().$where(processedInvoices.invoiceGUID.$eq(invoiceGUID)).$execute();

		return invoiceItems;
	} catch(exception){
		throw exception;
	}

}

function updateInvoiceStatus(invoiceGUID, newStatus, postedInvoice, workflowResponseComments){

	try{

		// Read the invoice items corresponding to the invoice GUID
		var invoiceItems = readInvoice(invoiceGUID);

		var i, invoiceItem, invoiceItemEntry;


		// Temporary fix
		if(invoiceItems[0].invoiceStatus !== ""){

			// Read the invoie entries and update the new status
			for(i = 0; i < invoiceItems.length; i++){
				invoiceItem = invoiceItems[i];

				invoiceItemEntry = processedInvoices.$get({
					invoiceGUID: invoiceItem.invoiceGUID,
					invoiceID: invoiceItem.invoiceID,
					invoiceItemIndex: invoiceItem.invoiceItemIndex
				});

				invoiceItemEntry.invoiceStatus = newStatus;

				// Save the posted invoice number as well, if supplied
				if(postedInvoice !== ""){
					invoiceItemEntry.postedInvoice = postedInvoice;
				}

				invoiceItemEntry.$save();
			}

		}

		// Create a corresponding log step for the change of status
		invoiceLogger.createLogStep(invoiceGUID, 'User_1', newStatus, workflowResponseComments); 


	} catch(exception){
		throw exception;
	}
}

function createInvoiceEntry(entityName, invoiceJSON){

	try{

		var invoices;

		var currentTS = getCurrentTS();

		switch(entityName){
			case "ExtractedInvoices":
				invoices = extractedInvoices;
				break;

			case "ProcessedInvoices":
				invoices = processedInvoices;
				break;
		}
		//invoiceJSON=invoiceJSON[0];

		var newInvoice = new invoices({
			"invoiceGUID": invoiceJSON.invoiceGUID,
			"invoiceID": invoiceJSON.invoiceID,
			"invoiceItemIndex": invoiceJSON.invoiceItemIndex,
			"invoiceUploadTS": invoiceJSON.uploadTimestamp, // currentTS,
			"documentDate": invoiceJSON.invoiceDate?createDateFormat(new Date(invoiceJSON.invoiceDate)):"",
			"invoiceDate": getCurrentDate(),
			"purchaseOrder": invoiceJSON.purchaseOrder,
			"invoiceCategory": invoiceJSON.invoiceCategory,
			"billToCompany": invoiceJSON.billToCompany,
			"billToName": invoiceJSON.billToName,
			"billToPhone": invoiceJSON.billToPhone,
			"billToAddress1": invoiceJSON.billToAddress1,
			"billToAddress2": invoiceJSON.billToAddress2,
			"billToCountry": invoiceJSON.billToCountry,
			"billToVAT": invoiceJSON.billToVAT,
			"billToEmail": invoiceJSON.billToEmail,
			"remitName": invoiceJSON.remitName,
			"remitToAddress1": invoiceJSON.remitToAddress1,
			"remitToAddress2": invoiceJSON.remitToAddress2,
			"remitToPin": invoiceJSON.remitToPin,
			"remitToStreet": invoiceJSON.remitToStreet,
			"remitToVAT": invoiceJSON.remitToVAT,
			"remitToEmail": invoiceJSON.remitToEmail,
			"remitToPhone": invoiceJSON.remitToPhone,
			"supplierNumber": invoiceJSON.supplierNumber,
			"supplierName": invoiceJSON.supplierName,
			"supplierName2": invoiceJSON.supplierName1,
			"supplierPOBox": invoiceJSON.supplierPOBox,
			"supplierPOBoxZip": invoiceJSON.supplierPOBoxZip,
			"supplierStreet": invoiceJSON.supplierStreet,
			"supplierState": invoiceJSON.supplierState,
			"supplierZip": invoiceJSON.supplierZip,
			"companyCode": invoiceJSON.companyCode,
			"grossAmount": invoiceJSON.grossAmount,
			"netAmount": invoiceJSON.netAmount,
			"invoiceFreightAmount": invoiceJSON.invoiceFreightAmount,
			"invoiceHandlingCharges": invoiceJSON.invoiceHandlingCharges,
			"requestorEmail": invoiceJSON.requestorEmail,
			"deliveryNoteNumber": invoiceJSON.deliveryNoteNumber,
			"paymentTerms": invoiceJSON.paymentTerms,
			"paymentDue": invoiceJSON.paymentDue,
			"paymentCurrency": invoiceJSON.paymentCurrency,
			"exchangeRate": invoiceJSON.exchangeRate,
			"bankAccount": invoiceJSON.bankAccount,
			"bankName": invoiceJSON.bankName,
			"bankNumber": invoiceJSON.bankNumber,
			"ibanNumber": invoiceJSON.ibanNumber,
			"swiftCode": invoiceJSON.swiftCode,
			"totalTaxAmount": invoiceJSON.totalTaxAmount,
			"vatAmount": invoiceJSON.vatAmount,
			"vatAmount1": invoiceJSON.vatAmount1,
			"vatAmount2": invoiceJSON.vatAmount2,
			"vatAmount3": invoiceJSON.vatAmount3,
			"vatAmount4": invoiceJSON.vatAmount4,
			"vatRate": invoiceJSON.vatRate,
			"vatRate1": invoiceJSON.vatRate1,
			"vatRate2": invoiceJSON.vatRate2,
			"vatRate3": invoiceJSON.vatRate3,
			"vatRate4": invoiceJSON.vatRate4,
			"vatID": invoiceJSON.vatID,
			"vatID1": invoiceJSON.vatID1,
			"vatID2": invoiceJSON.vatID2,
			"vatID3": invoiceJSON.vatID3,
			"vatID4": invoiceJSON.vatID4,
			"headerText": invoiceJSON.headerText,
			"itemPurchaseOrder": invoiceJSON.itemPurchaseOrder,
			"itemNumber": invoiceJSON.itemNumber,
			"itemDescription": invoiceJSON.itemDescription,
			"itemPrice": invoiceJSON.itemPrice,
			"itemQuantity": invoiceJSON.itemQuantity,
			"itemTax": invoiceJSON.itemTax,
			"itemUnit": invoiceJSON.itemUnit,
			"itemQuantityShipped": invoiceJSON.itemQuantityShipped,
			"unitPrice": invoiceJSON.unitPrice,
			"totalAmount": invoiceJSON.totalAmount,
			"pgiDate": invoiceJSON.pgiDate,
			"itemTaxRate": invoiceJSON.itemTaxRate,
			"itemCode": invoiceJSON.itemCode,
			"partNumber": invoiceJSON.partNumber,
			"shipToAddress1": invoiceJSON.shipToAddress1,
			"shipToAddress2": invoiceJSON.shipToAddress2,
			"glAccount": invoiceJSON.glAccount,
			"glDescription": invoiceJSON.glDescription,
			"costCenter": invoiceJSON.costCenter,
			"costCenterDescription": invoiceJSON.costCenterDescription,
			"wbsElement": invoiceJSON.wbsElement,
			"wbsElementDescription": invoiceJSON.wbsElementDescription,
			"internalOrder": invoiceJSON.internalOrder,
			"internalOrderDescription": invoiceJSON.internalOrderDescription,
			"assetID": invoiceJSON.assetID,
			"assetDescription": invoiceJSON.assetDescription,
			"invoiceFileName": invoiceJSON.invoiceFileName
		});

		newInvoice.$save();

	} catch (exception) {
		throw exception;
	}
}

function createInvoice(invoiceJSON){

	try{

		// Create entries for each invoice line item in the extracted and the
		// processed tables
		createInvoiceEntry("ExtractedInvoices", invoiceJSON);
		createInvoiceEntry("ProcessedInvoices", invoiceJSON);

		// Set the invoice status as 'Scanned'
		updateInvoiceStatus(invoiceJSON.invoiceGUID, invoiceStatus.scanned, "", "");

		return invoiceJSON;

	} catch (exception) {
		throw exception;
	}
}


function updateInvoiceItemEntry(processedInvoiceItemJSON, updateDerivedFields){

	try{
		var invoiceItem = processedInvoices.$get({
			invoiceGUID: processedInvoiceItemJSON.invoiceGUID,
			invoiceID: processedInvoiceItemJSON.invoiceID,
			invoiceItemIndex: processedInvoiceItemJSON.invoiceItemIndex
		});

// // The invoice status would always be 'In_Process', when it is saved on
// // the UI screen or while updating the derived fields.
// invoiceItem.invoiceStatus = "In_Process";

		if(updateDerivedFields){

			invoiceItem.documentType = processedInvoiceItemJSON.documentType;
			invoiceItem.documentDate = processedInvoiceItemJSON.documentDate;
			invoiceItem.postingDate = processedInvoiceItemJSON.postingDate;
			invoiceItem.companyCode = processedInvoiceItemJSON.companyCode;
			invoiceItem.invoicingParty = processedInvoiceItemJSON.invoicingParty;
			invoiceItem.invoiceType = processedInvoiceItemJSON.invoiceType;
			invoiceItem.supplierNumber = processedInvoiceItemJSON.supplierNumber;
			invoiceItem.paymentMethod = processedInvoiceItemJSON.paymentMethod;
			invoiceItem.paymentBlock = processedInvoiceItemJSON.paymentBlock;
			invoiceItem.partnerBank = processedInvoiceItemJSON.partnerBank;
			invoiceItem.houseBank = processedInvoiceItemJSON.houseBank;
			invoiceItem.houseBankAccountID = processedInvoiceItemJSON.houseBankAccountID;
			invoiceItem.paymentMethodSupp = processedInvoiceItemJSON.paymentMethodSupp;
			invoiceItem.autoCalculateTaxIndicator = processedInvoiceItemJSON.autoCalculateTaxIndicator;
			invoiceItem.taxJurisdiction = processedInvoiceItemJSON.taxJurisdiction;
			invoiceItem.baselineDate = processedInvoiceItemJSON.baselineDate;
			invoiceItem.dueDate = processedInvoiceItemJSON.dueDate;
			invoiceItem.itemTax = processedInvoiceItemJSON.itemTax;
			invoiceItem.supplierName = processedInvoiceItemJSON.supplierName;
			invoiceItem.netAmount = processedInvoiceItemJSON.netAmount;
            invoiceItem.invoiceFreightAmount = processedInvoiceItemJSON.invoiceFreightAmount;
            invoiceItem.totalTaxAmount = processedInvoiceItemJSON.totalTaxAmount;
            invoiceItem.paymentCurrency = processedInvoiceItemJSON.paymentCurrency;
			invoiceItem.supplierName2 = processedInvoiceItemJSON.supplierName2;
			invoiceItem.remitName = processedInvoiceItemJSON.remitName;
			invoiceItem.remitToAddress1 = processedInvoiceItemJSON.remitToAddress1;
			invoiceItem.remitToAddress2 = processedInvoiceItemJSON.remitToAddress2;
			invoiceItem.remitToPin = processedInvoiceItemJSON.remitToPin;
			invoiceItem.remitToStreet = processedInvoiceItemJSON.remitToStreet;
			invoiceItem.remitToVAT = processedInvoiceItemJSON.remitToVAT;
			invoiceItem.billToEmail = processedInvoiceItemJSON.billToEmail;
			invoiceItem.itemCode = processedInvoiceItemJSON.itemCode;
			invoiceItem.billToCompany = processedInvoiceItemJSON.billToCompany;
			invoiceItem.billToAddress1 = processedInvoiceItemJSON.billToAddress1;
            invoiceItem.billToAddress2 = processedInvoiceItemJSON.billToAddress2;
            invoiceItem.billToCountry = processedInvoiceItemJSON.billToCountry;
            invoiceItem.supplierStreet = processedInvoiceItemJSON.supplierStreet; 
            invoiceItem.supplierPOBoxZip = processedInvoiceItemJSON.supplierPOBoxZip;
			invoiceItem.paymentTerms = processedInvoiceItemJSON.paymentTerms;
			invoiceItem.day1 = processedInvoiceItemJSON.day1;
			invoiceItem.day2 = processedInvoiceItemJSON.day2;
			invoiceItem.day3 = processedInvoiceItemJSON.day3;
			invoiceItem.discount1 = processedInvoiceItemJSON.discount1;
			invoiceItem.discount2 = processedInvoiceItemJSON.discount2;
			invoiceItem.exchangeRate = processedInvoiceItemJSON.exchangeRate;
			invoiceItem.withholdingTax = processedInvoiceItemJSON.withholdingTax;
			invoiceItem.unplannedDeliveryCost = processedInvoiceItemJSON.unplannedDeliveryCost;
			invoiceItem.instanceKey = processedInvoiceItemJSON.instanceKey;
			invoiceItem.alternatePayee = processedInvoiceItemJSON.alternatePayee;
			invoiceItem.materialNumber = processedInvoiceItemJSON.materialNumber;
			invoiceItem.itemNumber = processedInvoiceItemJSON.itemNumber;
			invoiceItem.itemUnit = processedInvoiceItemJSON.itemUnit;
			invoiceItem.taxCode = processedInvoiceItemJSON.taxCode;
			invoiceItem.accountAssigned = processedInvoiceItemJSON.accountAssigned;
			invoiceItem.directPostingMaterial = processedInvoiceItemJSON.directPostingMaterial;
			invoiceItem.lastUser = processedInvoiceItemJSON.lastUser;
			invoiceItem.currentUser = processedInvoiceItemJSON.currentUser;
			invoiceItem.lastUpdatedTS = processedInvoiceItemJSON.lastUpdatedTS;
			invoiceItem.lastRole = processedInvoiceItemJSON.lastRole;
			// Hasan code started
			invoiceItem.bankName = processedInvoiceItemJSON.bankName;
			invoiceItem.bankAccount = processedInvoiceItemJSON.bankAccount;
			invoiceItem.bankNumber =  processedInvoiceItemJSON.bankNumber;
			invoiceItem.bankPartnerType =  processedInvoiceItemJSON.bankPartnerType;
			// Hasan code ended
		} else{

			invoiceItem.invoiceDate = processedInvoiceItemJSON.invoiceDate;
			invoiceItem.paymentCurrency = processedInvoiceItemJSON.paymentCurrency;
			invoiceItem.headerText = processedInvoiceItemJSON.headerText;
			invoiceItem.totalTaxAmount = processedInvoiceItemJSON.totalTaxAmount;
			invoiceItem.autoCalculateTaxIndicator = processedInvoiceItemJSON.autoCalculateTaxIndicator;
			invoiceItem.vatAmount = processedInvoiceItemJSON.vatAmount;
			invoiceItem.vatAmount1 = processedInvoiceItemJSON.vatAmount1;
			invoiceItem.vatAmount2 = processedInvoiceItemJSON.vatAmount2;
			invoiceItem.vatAmount3 = processedInvoiceItemJSON.vatAmount3;
			invoiceItem.vatAmount4 = processedInvoiceItemJSON.vatAmount4;
			invoiceItem.vatRate = processedInvoiceItemJSON.vatRate;
			invoiceItem.vatRate1 = processedInvoiceItemJSON.vatRate1;
			invoiceItem.vatRate2 = processedInvoiceItemJSON.vatRate2;
			invoiceItem.vatRate3 = processedInvoiceItemJSON.vatRate3;
			invoiceItem.vatRate4 = processedInvoiceItemJSON.vatRate4;
			invoiceItem.paymentTerms = processedInvoiceItemJSON.paymentTerms;
			invoiceItem.bankAccount = processedInvoiceItemJSON.bankAccount;
			invoiceItem.bankName = processedInvoiceItemJSON.bankName;
			invoiceItem.bankNumber = processedInvoiceItemJSON.bankNumber;
			invoiceItem.bankPartnerType = processedInvoiceItemJSON.bankPartnerType;
			invoiceItem.vatID = processedInvoiceItemJSON.vatID;
			invoiceItem.vatID1 = processedInvoiceItemJSON.vatID1;
			invoiceItem.vatID2 = processedInvoiceItemJSON.vatID2;
			invoiceItem.vatID3 = processedInvoiceItemJSON.vatID3;
			invoiceItem.vatID4 = processedInvoiceItemJSON.vatID4;
			invoiceItem.requestorEmail = processedInvoiceItemJSON.requestorEmail;
			invoiceItem.invoiceFreightAmount = processedInvoiceItemJSON.invoiceFreightAmount;
			invoiceItem.invoiceHandlingCharges = processedInvoiceItemJSON.invoiceHandlingCharges;
			invoiceItem.documentItemInInvoice = processedInvoiceItemJSON.documentItemInInvoice;
			invoiceItem.purchaseOrder = processedInvoiceItemJSON.purchaseOrder;
			invoiceItem.itemPurchaseOrder = processedInvoiceItemJSON.itemPurchaseOrder;
			invoiceItem.uomPurchaseOrder = processedInvoiceItemJSON.uomPurchaseOrder;
			invoiceItem.amountDocumentCurrency = processedInvoiceItemJSON.amountDocumentCurrency;
			invoiceItem.deliveryNoteNumber = processedInvoiceItemJSON.deliveryNoteNumber;
			invoiceItem.directPostingGL = processedInvoiceItemJSON.directPostingGL;
			invoiceItem.invoiceCategory = processedInvoiceItemJSON.invoiceCategory;
			invoiceItem.shipToAddress1 = processedInvoiceItemJSON.shipToAddress1;
			invoiceItem.shipToAddress2 = processedInvoiceItemJSON.shipToAddress2;
			invoiceItem.billToCompany = processedInvoiceItemJSON.billToCompany;
			invoiceItem.billToName = processedInvoiceItemJSON.billToName;
			invoiceItem.billToPhone = processedInvoiceItemJSON.billToPhone;
			invoiceItem.billToAddress1 = processedInvoiceItemJSON.billToAddress1;
			invoiceItem.billToAddress2 = processedInvoiceItemJSON.billToAddress2;
			invoiceItem.billToCountry = processedInvoiceItemJSON.billToCountry;
			invoiceItem.billToVAT = processedInvoiceItemJSON.billToVAT;
			invoiceItem.billToEmail = processedInvoiceItemJSON.billToEmail;
			invoiceItem.remitName = processedInvoiceItemJSON.remitName;
			invoiceItem.remitToAddress1 = processedInvoiceItemJSON.remitToAddress1;
			invoiceItem.remitToAddress2 = processedInvoiceItemJSON.remitToAddress2;
			invoiceItem.remitToPin = processedInvoiceItemJSON.remitToPin;
			invoiceItem.remitToStreet = processedInvoiceItemJSON.remitToStreet;
			invoiceItem.remitToVAT = processedInvoiceItemJSON.remitToVAT;
			invoiceItem.remitToEmail = processedInvoiceItemJSON.remitToEmail;
			invoiceItem.remitToPhone = processedInvoiceItemJSON.remitToPhone;
			invoiceItem.supplierName = processedInvoiceItemJSON.supplierName;
			invoiceItem.supplierName2 = processedInvoiceItemJSON.supplierName2;
			invoiceItem.supplierPOBox = processedInvoiceItemJSON.supplierPOBox;
			invoiceItem.supplierPOBoxZip = processedInvoiceItemJSON.supplierPOBoxZip;
			invoiceItem.supplierStreet = processedInvoiceItemJSON.supplierStreet;
			invoiceItem.supplierState = processedInvoiceItemJSON.supplierState;
			invoiceItem.supplierZip = processedInvoiceItemJSON.supplierZip;
			invoiceItem.netAmount = processedInvoiceItemJSON.netAmount;
			invoiceItem.ibanNumber = processedInvoiceItemJSON.ibanNumber;
			invoiceItem.swiftCode = processedInvoiceItemJSON.swiftCode;
			invoiceItem.grossAmount = processedInvoiceItemJSON.grossAmount;
			invoiceItem.itemDescription = processedInvoiceItemJSON.itemDescription;
			invoiceItem.unitPrice = processedInvoiceItemJSON.unitPrice;
// invoiceItem.itemPrice = processedInvoiceItemJSON.itemPrice;
			invoiceItem.itemQuantity = processedInvoiceItemJSON.itemQuantity;
			invoiceItem.itemUnit = processedInvoiceItemJSON.itemUnit;
			invoiceItem.itemQuantityShipped = processedInvoiceItemJSON.itemQuantityShipped;
			invoiceItem.itemTax = processedInvoiceItemJSON.itemTax;
			invoiceItem.itemTaxRate = processedInvoiceItemJSON.itemTaxRate;
			invoiceItem.totalAmount = processedInvoiceItemJSON.totalAmount;
			invoiceItem.pgiDate = processedInvoiceItemJSON.pgiDate;
			invoiceItem.itemCode= processedInvoiceItemJSON.itemCode;
			invoiceItem.itemCompanyCode = processedInvoiceItemJSON.itemCompanyCode;
			invoiceItem.glAccount = processedInvoiceItemJSON.glAccount;
			invoiceItem.glDescription = processedInvoiceItemJSON.glDescription;
			invoiceItem.costCenter = processedInvoiceItemJSON.costCenter;
			invoiceItem.costCenterDescription = processedInvoiceItemJSON.costCenterDescription;
			invoiceItem.wbsElement = processedInvoiceItemJSON.wbsElement;
			invoiceItem.wbsElementDescription = processedInvoiceItemJSON.wbsElementDescription;
			invoiceItem.internalOrder = processedInvoiceItemJSON.internalOrder;
			invoiceItem.internalOrderDescription = processedInvoiceItemJSON.internalOrderDescription;
			invoiceItem.assetID = processedInvoiceItemJSON.assetID;
			invoiceItem.assetDescription = processedInvoiceItemJSON.assetDescription;
			invoiceItem.invoiceFileName = processedInvoiceItemJSON.invoiceFileName;
			invoiceItem.postedInvoice = processedInvoiceItemJSON.postedInvoice;
			invoiceItem.companyCode=processedInvoiceItemJSON.companyCode;

		}

		invoiceItem.$save();
		return invoiceItem;

	} catch (exception) {
		throw exception;
	}

}

function updateInvoice(processedInvoiceItemsJSON, updateDerivedFields) {

	var i, updatedInvoiceItems = [];

	try{

		for( i = 0; i < processedInvoiceItemsJSON.length; i++ ){
			updatedInvoiceItems.push(updateInvoiceItemEntry(processedInvoiceItemsJSON[i], updateDerivedFields));
		}	

		// Set the invoice status as 'In_Progress', everytime it is edited or
		// saved. The step to update the status should be performed only once,
		// the first time this function is invoked
		if(!updateDerivedFields){
			updateInvoiceStatus(processedInvoiceItemsJSON[0].invoiceGUID, invoiceStatus.inProgress, "", "");
		}

	} catch(exception){
		throw exception;
	}

	return updatedInvoiceItems;

}

function clearExceptions(invoiceGUID){

	// Delete the exception entries corresponding to the invoice GUID
	invoiceExceptions.$delete({ invoiceGUID: invoiceGUID });

}

function updatePostedInvoice(invoiceGUID, postedInvoice){


	try{

		// Read the invoice items corresponding to the invoice GUID
		var invoiceItems = readInvoice(invoiceGUID);

		var i, invoiceItem, invoiceItemEntry;

		// Read the invoice entries and update the status and the posted invoice
		// # in each of them
		for(i = 0; i < invoiceItems.length; i++){
			invoiceItem = invoiceItems[i];

			invoiceItemEntry = processedInvoices.$get({
				invoiceGUID: invoiceItem.invoiceGUID,
				invoiceID: invoiceItem.invoiceID,
				invoiceItemIndex: invoiceItem.invoiceItemIndex
			});

			invoiceItemEntry.invoiceStatus = "Posted";
			invoiceItemEntry.postedInvoice = postedInvoice;

			invoiceItemEntry.$save();
		}

	} catch(exception){
		throw exception;
	}
}
function updateExceptionWorkflowEntry(
    invoiceExceptionsJSON,
    invoiceWorkflowExceptionItems
) {
    let i = 0,
        j = 0;
    let exceptionStatus = null;

    var exceptionWorkflowItems = [];

    for (i = 0; i < invoiceWorkflowExceptionItems.length; i++) {
        exceptionStatus = {};

        for (j = 0; j < invoiceExceptionsJSON.length; j++) {
            var valueOfExceptionStatus = "SUCCESS";
            if (
                invoiceExceptionsJSON[j].exceptionMessage.indexOf(
                    invoiceWorkflowExceptionItems[i].exceptionRule
                ) > -1
            ) {
                if (invoiceWorkflowExceptionItems[i].bypassStatus) {
                    valueOfExceptionStatus = "WARNING";
                } else {
                    valueOfExceptionStatus = "ERROR";
                }
            }
            exceptionStatus.exceptionStatus = valueOfExceptionStatus;
            exceptionStatus.invoiceExceptionID =
                invoiceWorkflowExceptionItems[i].invoiceWorkflowExceptionId;
            exceptionStatus.invoiceGUID = invoiceExceptionsJSON[j].invoiceGUID;
        }

        exceptionWorkflowItems.push(exceptionStatus);
    }

    return exceptionWorkflowItems;
}

function updateInvoiceDisplayWorkflow(invoiceGUID, exceptionWorkflowItems) {
    let invoiceDisplayWorkflowItems = InvoiceDisplayWorkflows.$get({
        invoiceGUID: invoiceGUID
    });
    if (
        invoiceDisplayWorkflowItems &&
        invoiceDisplayWorkflowItems.length === 0
    ) {
        for (let i = 0; i < exceptionWorkflowItems.length; i++) {
            const newinvoiceDisplayWorkflowItems = new InvoiceDisplayWorkflows({
                invoiceGUID: exceptionWorkflowItems[i].invoiceGUID,
                invoiceExceptionID:
                    exceptionWorkflowItems[i].invoiceExceptionID,
                exceptionStatus: exceptionWorkflowItems[i].exceptionStatus
            });
            newinvoiceDisplayWorkflowItems.$save();
        }
    } else {
        invoiceDisplayWorkflowItems.sort(function(a, b){
               return a.invoiceExceptionID.localeCompare(b.invoiceExceptionId);
            }
        );
        exceptionWorkflowItems.sort(function (a, b) {
                return a.invoiceExceptionID.localeCompare(b.invoiceExceptionId);
            }
        );
        for(let i = 0;i < invoiceDisplayWorkflowItems.length;i++){
            invoiceDisplayWorkflowItems[i].exceptionStatus = exceptionWorkflowItems[i].exceptionStatus;
            invoiceDisplayWorkflowItems[i].$save();
        }
    }
}

function updateExceptions(invoiceExceptionsJSON){
	
	var i, invoiceException, newInvoiceExceptions = [], newInvoiceException;
	var	exceptionWorkflowItems=null;

	try{
		var invoiceWorkflowExceptionItems = workflowExceptions.$get();

		// Insert the newly generated exceptions corresponding to the invoice
		for( i = 0; i < invoiceExceptionsJSON.length; i++){

 invoiceException = invoiceExceptionsJSON[i];

			newInvoiceException = new invoiceExceptions({
				"invoiceGUID": invoiceException.invoiceGUID,
				"exceptionIndex": invoiceException.exceptionIndex,
				"exceptionMessage": invoiceException.exceptionMessage
			});
			

			newInvoiceException.$save();

			newInvoiceExceptions.push(newInvoiceException);
		}
		
exceptionWorkflowItems = updateExceptionWorkflowEntry(invoiceExceptionsJSON,invoiceWorkflowExceptionItems);
    updateInvoiceDisplayWorkflow(invoiceExceptionsJSON.invoiceGUID, exceptionWorkflowItems);



	} catch(exception){
		throw exception;
	}

	return {
	    exceptions:newInvoiceExceptions,
	    exceptionWorkflowItems:exceptionWorkflowItems
	};
}

