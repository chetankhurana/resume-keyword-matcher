import { scrapeActivePage } from '../utils/scrapers';

// Listen for messages from the popup or side panel to extract job details
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCRAPE_JOB') {
    try {
      const jobDetails = scrapeActivePage();
      sendResponse({ success: true, data: jobDetails });
    } catch (error: any) {
      console.error('Error scraping job details:', error);
      sendResponse({ success: false, error: error.message || 'Unknown error occurred while scraping.' });
    }
  }
  return true; // Keep message channel open for async response
});
