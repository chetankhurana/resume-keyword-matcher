// Background service worker for Resume Keyword Matcher

chrome.runtime.onInstalled.addListener(() => {
  // Create a context menu item to allow manual text analysis
  chrome.contextMenus.create({
    id: 'analyze-selection-jd',
    title: 'Analyze Selected Job Description',
    contexts: ['selection']
  });
  
  console.log('Resume Keyword Matcher service worker installed.');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'analyze-selection-jd' && info.selectionText && tab?.windowId) {
    try {
      // Store custom text temporarily in session storage
      await chrome.storage.session.set({
        pendingJdAnalysis: {
          title: 'Selected Custom Job',
          company: 'Context Selection',
          description: info.selectionText,
          url: tab.url || 'Manual Context Selection',
          timestamp: Date.now()
        }
});

// Auto-inject content script on tab updates and navigation (for SPA support)
const JOB_BOARD_MATCH_PATTERNS = [
  '*://*.linkedin.com/*',
  '*://*.naukri.com/*',
  '*://*.indeed.com/*',
  '*://*.internshala.com/*',
  '*://*.greenhouse.io/*',
  '*://*.lever.co/*',
];

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only inject when tab is complete and matches a domain, not for every status change
  if (changeInfo.status !== 'complete' || !tab.url) return;
  if (!JOB_BOARD_MATCH_PATTERNS.some(pattern => {
    const re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*'));
    return re.test(tab.url || '');
  })) return;
  try {
    // Try to execute; if content already injected, it's harmless
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
      world: 'MAIN' // helps with SPA navigation
    });
  } catch (e) {
    // Usually means permission error or already injected
    //console.warn('Injection failed:', e);
  }
});

      
      // Open the side panel in the active window
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (error) {
      console.error('Error opening side panel from context menu:', error);
    }
  }
});
