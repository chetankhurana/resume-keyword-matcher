import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDFJS Worker
const isExtension = typeof chrome !== 'undefined' && chrome.runtime?.getURL;
pdfjsLib.GlobalWorkerOptions.workerSrc = isExtension
  ? chrome.runtime.getURL('pdf.worker.min.mjs')
  : '/pdf.worker.min.mjs';

export async function parsePdf(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tokenizedText = await page.getTextContent();
      const pageText = tokenizedText.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file. Make sure it is a valid PDF.');
  }
}

export async function parseDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file. Make sure it is a valid document.');
  }
}
