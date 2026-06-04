import { JobDetails, ProjectIdea } from '../types';

// Read from Vite env (baked in at build time from the gitignored .env file).
// This keeps the key out of source control while still allowing it to ship in the built extension.
const BUILD_TIME_KEY: string = import.meta.env.VITE_GEMINI_API_KEY ?? '';

export async function fetchAISuggestions(
  resumeText: string,
  jd: JobDetails,
  customApiKey?: string
): Promise<{ suggestions: string[]; projectIdeas: ProjectIdea[] }> {
  // Priority: user-configured key (from chrome.storage) → build-time env key
  const apiKey = customApiKey?.trim() || BUILD_TIME_KEY;

  if (!apiKey) {
    throw new Error(
      'No Gemini API key configured. Please add your key in the extension settings.'
    );
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
You are an expert ATS (Applicant Tracking System) optimizer and senior technical recruiter.
Analyze the following Job Description and candidate's Resume.

Job Description:
Title: ${jd.title}
Company: ${jd.company}
Description:
${jd.description}

Resume:
${resumeText}

Tasks:
1. Analyze gaps in skills, languages, experience, or certifications.
2. Generate 3 to 5 highly specific, actionable suggestions to optimize the candidate's resume for this role. For missing skills, write clear bullet point rewrite examples using the STAR format (Situation, Task, Action, Result) if applicable.
3. Generate 2 tailored, high-impact project ideas that the candidate could build to showcase the critical missing skills from this job description. Include project titles, descriptions, and technology stacks.

IMPORTANT: You MUST respond STRICTLY in JSON format. Do not output any markdown wrapper (like \`\`\`json), explanations, or notes.
JSON Structure:
{
  "suggestions": [
    "Identify what is missing and show a concrete example of how to frame it on the resume...",
    "Structure tip..."
  ],
  "projectIdeas": [
    {
      "title": "Project Name",
      "description": "Detailed description of what to build and how it demonstrates the missing skills...",
      "technologies": ["React", "TypeScript", "Redis"]
    }
  ]
}
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Empty response payload from Gemini API.');
    }

    const parsed = JSON.parse(responseText.trim());
    return {
      suggestions: parsed.suggestions || [],
      projectIdeas: parsed.projectIdeas || []
    };
  } catch (error) {
    console.error('AI suggestions fetch failed:', error);
    throw error;
  }
}
