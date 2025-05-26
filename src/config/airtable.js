const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PDF_RECORDS_TABLE = process.env.AIRTABLE_PDF_RECORDS_TABLE || 'PDF Records';
const PDF_FIELD_NAME = process.env.AIRTABLE_PDF_FIELD_NAME || 'PDF File';

/**
 * Upload PDF to Airtable using the uploadAttachment endpoint (new Web API)
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} recordId - The Airtable record ID to attach the PDF to
 * @returns {Promise<Object>} The response from Airtable
 */
async function uploadPDFToAirtable(pdfBuffer, recordId) {
    // Prepare the multipart form data
    const form = new FormData();
    form.append('file', pdfBuffer, {
        filename: 'document.pdf',
        contentType: 'application/pdf'
    });

    // Prepare the API endpoint for uploadAttachment
    const url = `https://content.airtable.com/v0/${AIRTABLE_BASE_ID}/${recordId}/${encodeURIComponent(PDF_FIELD_NAME)}/uploadAttachment`;

    try {
        const response = await axios.post(url, form, {
            headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                ...form.getHeaders()
            },
            maxContentLength: 5 * 1024 * 1024 // 5 MB
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading PDF to Airtable via uploadAttachment:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    uploadPDFToAirtable
}; 