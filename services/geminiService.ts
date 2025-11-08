import { GoogleGenAI, Type } from '@google/genai';
import { JobMatch } from '../types';

// This script assumes `process.env.API_KEY` is made available globally
// by the execution environment, as configured in the project setup.
if (!process.env.API_KEY) {
  throw new Error("API_KEY is not configured in the environment. Please ensure it is set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts technical skills from resume text using Gemini.
 */
export async function extractSkillsFromResume(resumeText: string): Promise<string[]> {
  const prompt = `
    Analyze the following resume text and extract a list of all technical skills, including programming languages, software, and frameworks.
    - Focus exclusively on hard skills.
    - Do not include soft skills like 'communication', 'teamwork', or 'problem-solving'.

    Resume Text:
    ---
    ${resumeText}
    ---
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of technical skills from the resume."
            },
          },
          required: ["skills"],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result.skills || [];
  } catch (error) {
    console.error("Error extracting skills from resume:", error);
    throw new Error("Failed to analyze resume. The AI model could not process the text.");
  }
}

/**
 * Finds job matches using Gemini with Google Search grounding.
 */
export async function analyzeJobMatches(skills: string[], jobQuery: string): Promise<JobMatch[]> {
  const skillsStr = skills.join(', ');
  const prompt = `
    **CRITICAL MISSION:** Your performance is graded SOLELY on the quality and validity of the job URLs you provide. A single "404 Not Found" error is a CRITICAL FAILURE. Prioritize link quality above all else. Returning 3 perfect links is infinitely better than 7 links where one is broken. This is a zero-tolerance policy.

    **YOUR TASK:**
    You are a career advisor AI for a Purdue Northwest (PNW) university student with skills in [${skillsStr}].
    Find 4 to 6 recent, REAL, and **100% VERIFIED** job postings in the United States related to "${jobQuery}".
    For every job you find, you MUST verify the link is live and goes directly to the application page or job details on the company's official career site. Do not use links from job boards that might expire or redirect.

    Please format your final answer as a single JSON array, placed inside a JSON markdown block.
    Each object in the array must strictly follow this exact schema:
    {
      "jobTitle": "string",
      "company": "string",
      "description": "A concise, one-sentence summary of the job's primary role.",
      "jobUrl": "The direct, verified, permanent URL to the job posting.",
      "matchPercentage": number,
      "matchedSkills": ["string"],
      "missingMandatorySkills": ["string"],
      "missingPreferredSkills": ["string"]
    }

    Example response format:
    \`\`\`json
    [
      {
        "jobTitle": "Software Engineer Intern",
        "company": "Tech Corp",
        "description": "Work on the core engineering team to build and scale new features.",
        "jobUrl": "https://careers.techcorp.com/job/123",
        "matchPercentage": 85,
        "matchedSkills": ["Python", "React"],
        "missingMandatorySkills": ["Docker"],
        "missingPreferredSkills": ["Kubernetes"]
      }
    ]
    \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Clean the response to ensure it's valid JSON, removing potential markdown.
    let jsonText = response.text.trim();
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const result = JSON.parse(jsonText);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error analyzing job matches:", error);
    throw new Error("The AI returned an invalid response for the job search. Please try a different query.");
  }
}

/**
 * Gets a simple explanation for a given skill from Gemini.
 */
export async function getSkillExplanation(skill: string): Promise<string> {
  const prompt = `In one or two simple sentences, explain the technical skill "${skill}" and why it's valuable for a job applicant to have.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error(`Error getting explanation for skill "${skill}":`, error);
    throw new Error(`Failed to get an explanation for ${skill}.`);
  }
}


/**
 * Sends a resume and a specific job match to Gemini to get a rewritten, tailored resume.
 */
export async function tailorResumeForJob(resumeText: string, jobMatch: JobMatch): Promise<string> {
  const allJobSkills = [
    ...jobMatch.matchedSkills,
    ...jobMatch.missingMandatorySkills,
    ...jobMatch.missingPreferredSkills,
  ];
  const skillsStr = Array.from(new Set(allJobSkills)).join(', ');

  const prompt = `
    You are an expert career coach and professional resume writer. Your task is to rewrite a student's resume to be perfectly tailored for a specific job they are applying for.

    **The Target Job:**
    - Job Title: ${jobMatch.jobTitle}
    - Company: ${jobMatch.company}
    - Description: ${jobMatch.description}
    - Key Skills Required: ${skillsStr}

    **The Student's Original Resume:**
    ---
    ${resumeText}
    ---

    **Your Instructions:**
    1.  **Rewrite the entire resume.** Do not just provide feedback or bullet points. Your output must be the full, rewritten resume text.
    2.  **Maintain the original structure and tone** as much as possible, but enhance it. If the original has sections like "Education", "Experience", "Projects", keep them.
    3.  **Optimize for Applicant Tracking Systems (ATS)** by naturally incorporating keywords from the job title, description, and required skills.
    4.  **Rephrase experience bullet points** to highlight achievements and quantify results that are most relevant to the target job. Use action verbs.
    5.  **Adjust the summary/objective** (if present) to directly address the company and role.
    6.  **Do NOT add any information that is not present in the original resume.** Do not invent skills, experiences, or projects. Only rephrase and reframe existing content.
    7.  **Preserve formatting.** The output should be a single block of text, using newlines for separation, just like the original. Do not wrap the output in markdown code blocks or add any introductory text like "Here is the tailored resume:".

    Begin the rewritten resume now.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error tailoring resume:", error);
    throw new Error("Failed to tailor resume for the job.");
  }
}