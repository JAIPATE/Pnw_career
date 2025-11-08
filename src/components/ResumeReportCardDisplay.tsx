
import React from 'react';
import { ResumeReportCard } from '../types';
import ATSScore from './ATSScore';

const ReportSection: React.FC<{title: string; content: string}> = ({title, content}) => (
    <div>
        <h4 className="font-bold text-lg text-amber-300 mb-2">{title}</h4>
        <div className="text-sm bg-gray-900/50 p-3 rounded-md border border-gray-700">
            <pre className="whitespace-pre-wrap font-sans">{content}</pre>
        </div>
    </div>
);

const ResumeReportCardDisplay: React.FC<{ report: ResumeReportCard }> = ({ report }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-300">
      <div className="md:col-span-1 flex justify-center items-start pt-4">
        <ATSScore score={report.atsScore} />
      </div>
      <div className="md:col-span-2 space-y-6">
        <div>
            <h4 className="font-bold text-lg text-amber-300 mb-2">Overall Summary</h4>
            <p className="text-sm">{report.overallSummary}</p>
        </div>
        <ReportSection title="Keyword Analysis" content={report.keywordAnalysis} />
        <ReportSection title="Impact Wording Suggestions" content={report.impactWording} />
        <ReportSection title="Formatting & Structure Tips" content={report.formattingStructure} />
      </div>
    </div>
  );
};

export default ResumeReportCardDisplay;
