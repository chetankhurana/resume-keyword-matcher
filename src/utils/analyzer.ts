import { AnalysisResult, CategorizedSkills, ProjectIdea } from '../types';

// Comprehensive dictionary of tech and soft skills grouped by category
const SKILL_DICTIONARY: { [key: string]: string[] } = {
  "Programming Languages": [
    "javascript", "typescript", "python", "java", "c\\+\\+", "c\\#", "ruby", "go", "rust", 
    "swift", "kotlin", "php", "sql", "html", "css", "bash", "r", "scala", "objective-c", "perl"
  ],
  "Frameworks": [
    "react", "angular", "vue", "next\\.js", "express", "nestjs", "spring boot", "django", 
    "flask", "fastapi", "laravel", "ruby on rails", "asp\\.net", "redux", "svelte", 
    "tailwind css", "bootstrap", "jquery", "pytorch", "tensorflow", "keras", "pandas", 
    "numpy", "scikit-learn"
  ],
  "Databases": [
    "postgresql", "mongodb", "mysql", "redis", "dynamodb", "oracle", "sqlite", 
    "cassandra", "neo4j", "mariadb", "elasticsearch", "firebase firestore"
  ],
  "Cloud": [
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "serverless", 
    "cloudflare", "aws lambda", "ecs", "s3", "ec2", "cloudfront", "amplify", "devops"
  ],
  "Tools": [
    "git", "github", "gitlab", "jenkins", "jira", "figma", "webpack", "vite", "babel", 
    "npm", "yarn", "pnpm", "postman", "ansible", "prometheus", "grafana", "ci/cd"
  ],
  "Soft Skills": [
    "communication", "leadership", "teamwork", "problem solving", "mentoring", "agile", 
    "scrum", "project management", "collaboration", "time management", "adaptability", 
    "critical thinking", "emotional intelligence", "product management", "system design"
  ]
};

// Flatten dictionary for general keyword checks
const ALL_DICT_KEYWORDS = Object.values(SKILL_DICTIONARY).flat();

/**
 * Normalizes text for better keyword matching
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[\s\n\r\t]+/g, ' ');
}

/**
 * Searches for a skill using word boundaries
 */
function checkSkillMatch(text: string, skill: string): boolean {
  // Handle special characters like C++ or Next.js in regex
  let pattern = `\\b${skill}\\b`;
  
  // Custom boundaries for skills ending/starting with special characters
  if (skill.endsWith('\\+\\+') || skill.endsWith('\\#') || skill.includes('\\.')) {
    pattern = `(?:^|\\s|[^a-zA-Z0-9])${skill}(?:$|\\s|[^a-zA-Z0-9])`;
  }
  
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(text);
  } catch (e) {
    return text.includes(skill.replace(/\\/g, ''));
  }
}

/**
 * Extracts required years of experience from job description
 */
function extractRequiredYears(jdText: string): number {
  const norm = normalizeText(jdText);
  // Match patterns like "5+ years", "3-5 years", "minimum of 2 years"
  const regexes = [
    /(\d+)\+?\s*(?:years?|yrs?)\b/i,
    /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:years?|yrs?)\b/i,
    /(?:require|minimum of|at least)\s*(\d+)\s*(?:years?|yrs?)\b/i
  ];

  for (const regex of regexes) {
    const match = norm.match(regex);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return 0; // Default to 0 if not specified
}

/**
 * Estimates years of experience from resume
 */
function estimateResumeYears(resumeText: string): number {
  const norm = normalizeText(resumeText);
  const regexes = [
    /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|work|industry)\b/i,
    /(?:experience|worked\s+for)\s*(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)\b/i
  ];

  let maxYears = 0;
  for (const regex of regexes) {
    const match = norm.match(regex);
    if (match) {
      const yrs = parseInt(match[1], 10);
      if (yrs > maxYears) maxYears = yrs;
    }
  }

  // Fallback: search for numbers near standard headers or job durations
  // (In a simple rule engine, max years found in text is a good heuristic)
  return maxYears || 1; // Default to 1 year if nothing found
}

/**
 * Generates tailored suggestions based on missing skills
 */
function generateSuggestions(missingSkills: string[], jdText: string): string[] {
  const suggestions: string[] = [];
  
  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 3).map(s => s.toUpperCase()).join(', ');
    suggestions.push(`Integrate the missing skills [ ${topMissing} ] in your professional summary and project descriptions if you have prior experience with them.`);
  }

  // Scan JD for structural keywords
  const jdLower = jdText.toLowerCase();
  if (jdLower.includes('certification') || jdLower.includes('certified')) {
    suggestions.push("The job description mentions 'Certifications'. If you hold any relevant industry certifications (e.g. AWS, Scrum, Google Cloud), list them prominently.");
  }

  if (jdLower.includes('leadership') || jdLower.includes('lead') || jdLower.includes('mentor')) {
    suggestions.push("This is a role with leadership expectations. Add bullet points highlighting how you mentored junior members, led sprint planning, or managed cross-functional projects.");
  }

  // General structural advice
  suggestions.push("Quantify your achievements. Instead of writing 'Responsible for building APIs', rewrite as 'Designed and implemented 15+ REST APIs reducing response latency by 20% using the STAR format (Situation, Task, Action, Result)'.");
  suggestions.push("Ensure your resume layout is clean, single-page (if under 5 years of experience), and avoids complex multi-column tables or text boxes which confuse ATS parsers.");

  return suggestions;
}

/**
 * Generates tailored project ideas
 */
function generateProjectIdeas(missingSkills: string[], jobTitle: string): ProjectIdea[] {
  const title = jobTitle.toLowerCase();
  const ideas: ProjectIdea[] = [];
  
  const skillList = missingSkills.slice(0, 3);
  if (skillList.length === 0) {
    // Default fallback projects
    return [
      {
        title: "Enterprise Web App Architecture",
        description: "Develop a secure, multi-tenant SaaS application implementing rate-limiting, comprehensive logging, and auto-scaling components.",
        technologies: ["TypeScript", "React", "Docker", "Node.js"]
      },
      {
        title: "Full-Stack Dashboard Platform",
        description: "Design a high-performance real-time data visualizer fetching metrics from external APIs and rendering complex statistical charts.",
        technologies: ["React", "PostgreSQL", "Tailwind CSS", "Vite"]
      }
    ];
  }

  if (title.includes('data') || title.includes('ml') || title.includes('analyst') || title.includes('machine learning')) {
    ideas.push({
      title: `End-to-End Pipeline with ${skillList[0].toUpperCase()}`,
      description: `Build an automated data collection and analysis pipeline. Ingest raw public data, clean it, and serve predictions or statistics through an interactive interface.`,
      technologies: [...skillList.map(s => s.toUpperCase()), "Python", "SQL"]
    });
    ideas.push({
      title: "Real-time Metrics Dashboard",
      description: "Build a stream processing pipeline utilizing caching and database integrations to display live system telemetry on a modern user interface.",
      technologies: [...skillList.map(s => s.toUpperCase()), "Docker", "PostgreSQL"]
    });
  } else {
    // Developer or general software engineer
    ideas.push({
      title: `Modern SaaS Application using ${skillList[0].toUpperCase()}`,
      description: `Develop a production-ready application integrating user authentication, database caching, and responsive interfaces that highlights your expertise in ${skillList.map(s => s.toUpperCase()).join(' & ')}.`,
      technologies: [...skillList.map(s => s.toUpperCase()), "TypeScript", "Tailwind CSS"]
    });
    ideas.push({
      title: `Serverless REST API Gateway`,
      description: `Architect a scalable, microservices-based API implementing custom request routing, performance monitoring, and rapid caching.`,
      technologies: [...skillList.map(s => s.toUpperCase()), "Docker", "CI/CD"]
    });
  }

  return ideas;
}

/**
 * The core matching algorithm
 */
export function analyzeResume(resumeText: string, jd: { title: string; company: string; description: string; url: string }, resumeId: string): AnalysisResult {
  const normJD = normalizeText(jd.description);
  const normResume = normalizeText(resumeText);

  // 1. Identify which skills are present in the JD
  const jdSkills: { [category: string]: string[] } = {};
  let totalJdSkillsCount = 0;

  for (const [category, skills] of Object.entries(SKILL_DICTIONARY)) {
    jdSkills[category] = skills.filter(skill => checkSkillMatch(normJD, skill));
    totalJdSkillsCount += jdSkills[category].length;
  }

  // Fallback: If no dictionary skills are found in JD, parse common words as general keywords
  if (totalJdSkillsCount === 0) {
    // Extract words length > 4 that look technical from description
    const words = normJD.split(/[^a-zA-Z]/).filter(w => w.length > 4);
    const uniqueWords = Array.from(new Set(words));
    // Let's populate Programming Languages with some matching terms so we have something to match
    jdSkills["Programming Languages"] = uniqueWords.slice(0, 5);
    totalJdSkillsCount = jdSkills["Programming Languages"].length;
  }

  // 2. Classify JD skills into present vs missing in the resume
  const categorizedSkills: CategorizedSkills = {};
  const presentKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const [category, skills] of Object.entries(jdSkills)) {
    const present: string[] = [];
    const missing: string[] = [];

    skills.forEach(skill => {
      const prettySkill = skill.replace(/\\/g, ''); // strip regex escapes for display
      if (checkSkillMatch(normResume, skill)) {
        present.push(prettySkill);
        presentKeywords.push(prettySkill);
      } else {
        missing.push(prettySkill);
        missingKeywords.push(prettySkill);
      }
    });

    categorizedSkills[category] = { present, missing };
  }

  // 3. Compute Sub-scores

  // A. Skills Score (40% weight) - ratio of matched JD skills
  const skillsScore = totalJdSkillsCount > 0 
    ? Math.round((presentKeywords.length / totalJdSkillsCount) * 100) 
    : 100;

  // B. Keyword Coverage Score (30% weight) - overlap against standard industry nouns
  // Let's extract any matching words from our overall technical dictionary found in JD, and check in resume
  const jdKeywordsInDict = ALL_DICT_KEYWORDS.filter(k => checkSkillMatch(normJD, k));
  const matchedJdKeywords = jdKeywordsInDict.filter(k => checkSkillMatch(normResume, k));
  const keywordScore = jdKeywordsInDict.length > 0
    ? Math.round((matchedJdKeywords.length / jdKeywordsInDict.length) * 100)
    : 100;

  // C. Experience Score (20% weight)
  const reqYears = extractRequiredYears(jd.description);
  const hasYears = estimateResumeYears(resumeText);
  let experienceScore = 100;
  
  if (reqYears > 0) {
    if (hasYears >= reqYears) {
      experienceScore = 100;
    } else {
      experienceScore = Math.max(40, Math.round((hasYears / reqYears) * 100));
    }
  }

  // D. Education Score (10% weight)
  let educationScore = 100;
  const jdHasEdu = /degree|bachelor|master|phd|b\.s\.|m\.s\.|btech|mtech|computer science|engineering/i.test(normJD);
  if (jdHasEdu) {
    const resumeHasEdu = /degree|bachelor|master|phd|b\.s\.|m\.s\.|btech|mtech|university|college|computer science|engineering/i.test(normResume);
    educationScore = resumeHasEdu ? 100 : 50;
  }

  // 4. Compute Overall ATS Score
  const overallScore = Math.round(
    (skillsScore * 0.4) +
    (keywordScore * 0.3) +
    (experienceScore * 0.2) +
    (educationScore * 0.1)
  );

  // 5. Suggestions and Project Ideas
  const suggestions = generateSuggestions(missingKeywords, jd.description);
  const projectIdeas = generateProjectIdeas(missingKeywords, jd.title);

  return {
    overallScore,
    skillsScore,
    experienceScore,
    educationScore,
    keywordScore,
    presentKeywords,
    missingKeywords,
    categorizedSkills,
    suggestions,
    projectIdeas,
    analyzedAt: new Date().toISOString(),
    resumeId,
    jobUrl: jd.url
  };
}
