import { JobDetails } from '../types';

interface SiteScraper {
  name: string;
  urlMatch: RegExp;
  titleSelector: string[];
  companySelector: string[];
  descriptionSelector: string[];
}

const SITE_SCRAPERS: SiteScraper[] = [
  {
    name: "LinkedIn",
    urlMatch: /linkedin\.com/i,
    titleSelector: [
      ".job-details-jobs-unified-top-card__job-title",
      ".jobs-unified-top-card__job-title h1",
      "h1.t-24",
      ".jobs-details-sidebar__title",
      ".jobs-search__results-list__title"
    ],
    companySelector: [
      ".job-details-jobs-unified-top-card__company-name a",
      ".jobs-unified-top-card__company-name",
      "a.jobs-unified-top-card__company-name",
      ".jobs-details-sidebar__company-name",
      ".job-details-jobs-unified-top-card__primary-description a"
    ],
    descriptionSelector: [
      "#job-details",
      ".jobs-description__content",
      ".jobs-box__html-content",
      ".jobs-description-content__text"
    ]
  },
  {
    name: "Naukri",
    urlMatch: /naukri\.com/i,
    titleSelector: [
      ".jd-header-title",
      ".job-desc-heading",
      "h1.jd-header-title",
      ".styles_jd-header-title__bbb4G"
    ],
    companySelector: [
      ".jd-header-comp-name",
      "a.pad-rt-8",
      ".styles_jd-header-comp-name__Hg2aE a",
      ".styles_jd-header-comp-name__Hg2aE"
    ],
    descriptionSelector: [
      ".job-desc",
      ".jd-desc",
      "section.job-desc",
      ".styles_job-desc__244Bl"
    ]
  },
  {
    name: "Indeed",
    urlMatch: /indeed\.com/i,
    titleSelector: [
      ".jobsearch-JobInfoHeader-title",
      "h1.jobsearch-JobInfoHeader-title",
      ".jobsearch-JobInfoHeader-title-container h1"
    ],
    companySelector: [
      "[data-company-name='true']",
      ".jobsearch-CompanyInfoWithoutHeaderImage",
      ".jobsearch-InlineCompanyRating a",
      ".jobsearch-InlineCompanyRating"
    ],
    descriptionSelector: [
      "#jobDescriptionText",
      ".jobsearch-jobDescriptionText"
    ]
  },
  {
    name: "Internshala",
    urlMatch: /internshala\.com/i,
    titleSelector: [
      ".profile_heading",
      ".heading_container h1",
      "h1.heading_title"
    ],
    companySelector: [
      ".company_name",
      ".heading_container h2",
      ".company_name a"
    ],
    descriptionSelector: [
      ".job_description",
      ".text-container",
      ".detail_view",
      ".internship_details"
    ]
  },
  {
    name: "Greenhouse",
    urlMatch: /greenhouse\.io/i,
    titleSelector: [
      ".app-title",
      "h1.heading",
      "#header h1"
    ],
    companySelector: [
      ".company-name",
      ".company-header",
      ".company-logo img"
    ],
    descriptionSelector: [
      "#content",
      ".job-body",
      "#main"
    ]
  },
  {
    name: "Lever",
    urlMatch: /lever\.co/i,
    titleSelector: [
      ".posting-header h2",
      "h1",
      ".posting-headline h2"
    ],
    companySelector: [
      ".posting-header .company",
      ".lever-logo",
      "a.posting-company"
    ],
    descriptionSelector: [
      ".section.page-centered",
      ".job-description",
      ".posting-page"
    ]
  }
];

function querySelectorFallback(selectors: string[]): string {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = (element as HTMLElement).innerText || '';
      if (text.trim()) return text.trim();
    }
  }
  return '';
}

/**
 * Intelligent generic page scraper fallback
 */
function scrapeGenericPage(): JobDetails {
  // Title: look for h1 inside main or body, pick first reasonable length
  let title = '';
  const h1Elements = Array.from(document.querySelectorAll('h1'));
  for (const h1 of h1Elements) {
    const text = h1.innerText.trim();
    if (text && text.length > 5 && text.length < 100) {
      title = text;
      break;
    }
  }
  if (!title) title = document.title.split('-')[0].trim();

  // Company: inspect meta tags or title or pick fallback
  let company = '';
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName) {
    company = (ogSiteName as HTMLMetaElement).content;
  }
  
  if (!company) {
    const titleParts = document.title.split(/[-|]/);
    if (titleParts.length > 1) {
      company = titleParts[titleParts.length - 1].trim();
    } else {
      company = "Unknown Company";
    }
  }

  // Description: search for large text sections, or search for divs with high text density
  let description = '';
  const candidateElements = Array.from(document.querySelectorAll('div, section, article, main'));
  
  // Look for headings referencing requirements/description
  const keywords = ['description', 'requirements', 'responsibilities', 'qualifications', 'about the role', 'what you will do'];
  let bestContainer: HTMLElement | null = null;
  let maxScore = 0;

  candidateElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    const text = htmlEl.innerText || '';
    if (text.length < 200 || text.length > 20000) return;

    let score = 0;
    keywords.forEach(kw => {
      if (text.toLowerCase().includes(kw)) score++;
    });

    if (score > maxScore) {
      maxScore = score;
      bestContainer = htmlEl;
    }
  });

  if (bestContainer) {
    description = (bestContainer as HTMLElement).innerText;
  } else {
    // Ultimate fallback: take body text minus script tags
    const bodyCopy = document.body.cloneNode(true) as HTMLElement;
    const scriptTags = bodyCopy.querySelectorAll('script, style, nav, footer, header');
    scriptTags.forEach(t => t.remove());
    description = bodyCopy.innerText;
  }

  return {
    title: title || "Job Opportunity",
    company: company || "Hiring Company",
    description: description.replace(/\s+/g, ' ').trim(),
    url: window.location.href
  };
}

export function scrapeActivePage(): JobDetails {
  const currentUrl = window.location.href;
  const matchedScraper = SITE_SCRAPERS.find(s => s.urlMatch.test(currentUrl));

  if (matchedScraper) {
    const title = querySelectorFallback(matchedScraper.titleSelector);
    const company = querySelectorFallback(matchedScraper.companySelector);
    let description = '';
    
    // For description, combine if multiple matching selectors return text
    for (const selector of matchedScraper.descriptionSelector) {
      const element = document.querySelector(selector);
      if (element) {
        description = (element as HTMLElement).innerText || '';
        if (description.trim()) break;
      }
    }

    if (title && description) {
      return {
        title,
        company: company || "Hiring Company",
        description: description.replace(/\s+/g, ' ').trim(),
        url: currentUrl
      };
    }
  }

  // Fallback to generic scraper
  return scrapeGenericPage();
}
