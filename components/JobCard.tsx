import React, { useState } from 'react';
import { JobMatch } from '../types';
import { getSkillExplanation, tailorResumeForJob } from '../services/geminiService';
import InfoIcon from './icons/InfoIcon';
import Modal from './Modal';
import Loader from './Loader';
import CopyToClipboardIcon from './icons/CopyToClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface JobCardProps {
  match: JobMatch;
  resumeText: string;
}

const SkillTag: React.FC<{ 
  children: React.ReactNode; 
  type: 'matched' | 'missing-mandatory' | 'missing-preferred';
  onExplain?: () => void;
}> = ({ children, type, onExplain }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5";
  const typeClasses = {
    'matched': "bg-green-800 text-green-200",
    'missing-mandatory': "bg-red-800 text-red-200",
    'missing-preferred': "bg-yellow-800 text-yellow-200",
  };
  
  return (
    <span className={`${baseClasses} ${typeClasses[type]}`}>
      {children}
      {onExplain && (
         <button onClick={onExplain} className="text-gray-400 hover:text-white transition-colors" aria-label={`Explain skill: ${children}`}>
          <InfoIcon />
        </button>
      )}
    </span>
  );
};


const JobCard: React.FC<JobCardProps> = ({ match, resumeText }) => {
  const [explanation, setExplanation] = useState<{ skill: string, text: string } | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<string | null>(null);
  const [skillExplanations, setSkillExplanations] = useState<Map<string, string>>(new Map());

  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [tailoredResume, setTailoredResume] = useState('');
  const [isTailoringLoading, setIsTailoringLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const handleExplainSkill = async (skill: string) => {
    if (skillExplanations.has(skill)) {
      setExplanation({ skill, text: skillExplanations.get(skill)! });
      return;
    }
    
    setIsLoadingExplanation(skill);
    setExplanation(null);
    try {
      const text = await getSkillExplanation(skill);
      setSkillExplanations(prev => new Map(prev).set(skill, text));
      setExplanation({ skill, text });
    } catch (error) {
       console.error("Failed to get skill explanation:", error);
       setExplanation({ skill, text: "Could not load explanation." });
    }
    setIsLoadingExplanation(null);
  };

  const handleTailorResume = async () => {
    setIsTailorModalOpen(true);
    setIsTailoringLoading(true);
    setTailoredResume('');
    try {
      const result = await tailorResumeForJob(resumeText, match);
      setTailoredResume(result);
    } catch (error) {
      console.error(error);
      setTailoredResume('Sorry, we couldn\'t tailor your resume for this job at this time.');
    } finally {
      setIsTailoringLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(tailoredResume);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };
  
  const percentage = Math.round(match.matchPercentage);
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Match Percentage Donut Chart */}
          <div className="flex-shrink-0 flex justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 44 44">
                <circle className="text-gray-700" strokeWidth="4" stroke="currentColor" fill="transparent" r="20" cx="22" cy="22" />
                <circle
                  className="text-amber-400"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="22"
                  cy="22"
                  transform="rotate(-90 22 22)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                {percentage}%
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div className='flex-1'>
                <h3 className="text-xl font-bold text-amber-300">{match.jobTitle}</h3>
                <p className="text-gray-400">{match.company}</p>
              </div>
              <div className='flex-shrink-0 flex items-center gap-2'>
                <button 
                  onClick={handleTailorResume}
                  className="px-3 py-2 bg-gray-700 text-amber-300 text-xs font-semibold rounded-md hover:bg-gray-600 transition-colors"
                >
                  Tailor Resume
                </button>
                <a
                  href={match.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-md hover:bg-amber-500 transition-colors"
                >
                  View Job &rarr;
                </a>
              </div>
            </div>
            <p className="mt-3 text-gray-300 text-sm">{match.description}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-700 relative">
              {explanation && (
                  <div className="absolute bottom-full mb-2 w-full max-w-md bg-gray-900 border border-amber-500 p-3 rounded-lg shadow-lg z-10">
                    <h5 className="font-bold text-amber-300 text-sm">{explanation.skill}</h5>
                    <p className="text-gray-300 text-xs mt-1">{explanation.text}</p>
                    <button onClick={() => setExplanation(null)} className="absolute top-1 right-1 text-gray-500 hover:text-white">&times;</button>
                  </div>
                )}
              
              {match.matchedSkills.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-green-400 mb-2">Matched Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.matchedSkills.map(skill => <SkillTag key={skill} type="matched">{skill}</SkillTag>)}
                  </div>
                </div>
              )}
              {match.missingMandatorySkills.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Missing Mandatory Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.missingMandatorySkills.map(skill => (
                      <SkillTag key={skill} type="missing-mandatory" onExplain={() => handleExplainSkill(skill)}>
                        {isLoadingExplanation === skill ? '...' : skill}
                      </SkillTag>
                    ))}
                  </div>
                </div>
              )}
              {match.missingPreferredSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">Missing Preferred Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.missingPreferredSkills.map(skill => (
                      <SkillTag key={skill} type="missing-preferred" onExplain={() => handleExplainSkill(skill)}>
                        {isLoadingExplanation === skill ? '...' : skill}
                      </SkillTag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal title={`AI Resume Tailoring for "${match.jobTitle}"`} isOpen={isTailorModalOpen} onClose={() => setIsTailorModalOpen(false)}>
        {isTailoringLoading ? <Loader message="Tailoring your resume..." /> : 
        (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg text-gray-300 mb-2">Original Resume</h3>
              <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-300 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">{resumeText}</pre>
            </div>
             <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-amber-300">AI-Tailored Resume</h3>
                <button
                  onClick={handleCopyToClipboard}
                  className="px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-2 transition-colors
                             bg-gray-700 text-amber-300 hover:bg-gray-600
                             disabled:bg-green-800 disabled:text-green-200"
                  disabled={hasCopied}
                >
                  {hasCopied ? <><CheckIcon /> Copied!</> : <><CopyToClipboardIcon /> Copy</>}
                </button>
              </div>
              <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-200 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto border border-amber-500/50">{tailoredResume}</pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default JobCard;