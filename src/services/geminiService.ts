

import { GoogleGenAI, Type } from '@google/genai';
import { JobMatch, ResumeReportCard } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY is not configured in the environment. Please ensure it is set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts skills from resume text using Gemini.
 */
export async function extractSkillsFromResume(resumeText: string): Promise<string[]> {
  const prompt = `
    Analyze the following resume text and extract a comprehensive list of all skills.
    - Include technical skills (e.g., programming languages, software, frameworks, tools).
    - Include soft skills (e.g., communication, leadership, teamwork, problem-solving).

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
              description: "A comprehensive list of all technical and soft skills from the resume."
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
    throw new Error("Failed to analyze resume. The AI model could not process the text. Please check the resume content and try again.");
  }
}

/**
 * Finds job matches using Gemini with Google Search grounding.
 */
export async function analyzeJobMatches(skills: string[], jobQuery: string, datePostedFilter: string): Promise<JobMatch[]> {
  const skillsStr = skills.join(', ');

  let dateFilterInstruction = '';
  switch (datePostedFilter) {
    case 'day':
      dateFilterInstruction = 'Filter the search results to jobs posted within the last 24 hours.';
      break;
    case '3days':
      dateFilterInstruction = 'Filter the search results to jobs posted within the last 3 days.';
      break;
    case 'week':
      dateFilterInstruction = 'Filter the search results to jobs posted within the last 7 days.';
      break;
    case '2weeks':
      dateFilterInstruction = 'Filter the search results to jobs posted within the last 14 days.';
      break;
  }

  const prompt = `
    **CRITICAL MISSION:** Your performance is being graded SOLELY on the quality and validity of the job URLs you provide. A single "404 Not Found" error is a CRITICAL FAILURE. Prioritize link quality above all else. Returning 3 perfect links is infinitely better than 7 links where one is broken.

    **ZERO TOLERANCE POLICY FOR BAD LINKS:**
    1.  **MANDATORY 2-STEP VERIFICATION:** For every job you identify:
        a. **Step 1 (Find):** Locate a promising job posting on a job board (LinkedIn, Indeed, etc.).
        b. **Step 2 (VERIFY AND REPLACE):** Take the Job Title and Company. Perform a NEW, separate Google Search for "[Company Name] careers [Job Title]". You MUST find the official job posting on the company's own careers website (e.g., careers.google.com, jobs.apple.com). This verified, direct link is your **\`jobUrl\`**.
    2.  **THE DIRECT LINK IS LAW:** The \`jobUrl\` MUST be the permanent link from the company's own domain. The job board link from Step 1 is the \`sourceUrl\`.
    3.  **NO DIRECT LINK = REJECT:** If you cannot find the job on the company's official career page after a diligent search, YOU MUST DISCARD THE JOB. Do not include it in the results. This is non-negotiable.

    **YOUR TASK:**
    You are a career advisor AI for a Purdue Northwest (PNW) student with skills in [${skillsStr}].
    Find 4 to 6 recent, REAL, and **100% VERIFIED** job postings in the United States related to "${jobQuery}".
    ${dateFilterInstruction ? `**DATE FILTER: ${dateFilterInstruction} This is a strict requirement.**` : ''}

    For each job, after successfully performing the 2-step verification, provide the data in a JSON array.

    **OUTPUT FORMAT (Strictly Adhere):**
    Your entire response MUST be a single JSON array inside a markdown block.
    {
      "jobTitle": "string",
      "company": "string",
      "description": "A concise, one-sentence summary of the job's primary role.",
      "jobUrl": "The direct, verified, permanent URL from the company's own career website.",
      "sourceUrl": "The URL of the job board or search result where the job was initially found.",
      "matchPercentage": number,
      "matchedSkills": ["string"],
      "missingMandatorySkills": ["string"],
      "missingPreferredSkills": ["string"]
    }
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
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1];
    }

    const result = JSON.parse(jsonText);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error analyzing job matches:", error);
    throw new Error("The AI failed to generate a valid job list. This can happen with very specific or unusual search terms. Please try a different query.");
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
    return `Failed to get an explanation for ${skill}.`;
  }
}


/**
 * Analyzes a resume against a job description to generate a "Resume Report Card".
 */
export async function getResumeReportCard(resumeText: string, jobMatch: JobMatch): Promise<ResumeReportCard> {
  const prompt = `
    You are an expert career coach and ATS (Applicant Tracking System) optimization specialist.
    Analyze a student's resume against a job description and generate a "Resume Report Card".

    **Target Job:**
    - Job Title: ${jobMatch.jobTitle} at ${jobMatch.company}
    - Description: ${jobMatch.description}

    **Student's Resume:**
    ---
    ${resumeText}
    ---

    **Instructions:**
    Your entire response MUST be a single JSON object that strictly adheres to the schema below.

    **Analysis Schema:**
    - atsScore: An integer from 0-100 on ATS compatibility.
    - overallSummary: A 2-3 sentence summary of the resume's fit for this role.
    - keywordAnalysis: A markdown bulleted list of missing keywords.
    - impactWording: A markdown bulleted list suggesting how to rephrase experience to show more impact.
    - formattingStructure: A markdown bulleted list of formatting tips for ATS.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.INTEGER, description: "ATS score (0-100)." },
            overallSummary: { type: Type.STRING, description: "Overall summary." },
            keywordAnalysis: { type: Type.STRING, description: "Markdown list of keyword analysis." },
            impactWording: { type: Type.STRING, description: "Markdown list for impact wording." },
            formattingStructure: { type: Type.STRING, description: "Markdown list for formatting tips." }
          },
          required: ["atsScore", "overallSummary", "keywordAnalysis", "impactWording", "formattingStructure"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error getting resume report card:", error);
    throw new Error("The AI failed to generate a report card for the resume.");
  }
}

/**
 * Provides general feedback on a resume without a specific job in mind.
 */
export async function getGeneralResumeFeedback(resumeText: string): Promise<string> {
    const prompt = `
    You are a professional career coach. Provide general, constructive feedback on the following resume.
    Focus on clarity, impact, and overall structure.
    Your feedback should be helpful for a university student looking for internships or entry-level roles.
    Format your feedback using markdown (headings, bold text, bullet points).

    Resume:
    ---
    ${resumeText}
    ---
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error getting general resume feedback:", error);
    throw new Error("The AI failed to generate general feedback for the resume.");
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
    You are an expert career coach and professional resume writer. Rewrite the student's resume to be perfectly tailored for the specific job they are applying for.

    **Target Job:**
    - Job Title: ${jobMatch.jobTitle} at ${jobMatch.company}
    - Description: ${jobMatch.description}
    - Key Skills Required: ${skillsStr}

    **Student's Original Resume:**
    ---
    ${resumeText}
    ---

    **Instructions:**
    1.  **Rewrite the entire resume text.** Your output must be the full, rewritten resume text.
    2.  **Optimize for Applicant Tracking Systems (ATS)** by naturally incorporating keywords from the job.
    3.  **Rephrase bullet points** to highlight achievements and quantify results relevant to the target job.
    4.  **Do NOT add any information that is not in the original resume.** Only rephrase and reframe existing content.
    5.  **Your output must be ONLY the rewritten resume text.** Do not include any introductory text, commentary, or markdown formatting.
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