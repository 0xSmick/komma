export interface Template {
  id: string;
  name: string;
  icon: string; // SVG path data for <path d="...">
  description: string;
  promptPrefix: string;
  sections: string[];
  skeleton: string;
  mcpRefs?: string[];
  isCustom?: boolean;
}

export const templates: Template[] = [
  {
    id: 'prd',
    name: 'PRD',
    icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
    description: 'Product requirements with goals, user stories, and specs',
    promptPrefix: 'Write a Product Requirements Document (PRD).',
    sections: [
      'Overview',
      'Problem Statement',
      'Goals & Success Metrics',
      'User Stories',
      'Requirements',
      'Technical Considerations',
      'Timeline',
    ],
    skeleton:
      '# [Title]\n\n## Overview\n\n## Problem Statement\n\n## Goals & Success Metrics\n\n## User Stories\n\n## Requirements\n\n## Technical Considerations\n\n## Timeline\n',
  },
  {
    id: 'strategy',
    name: 'Strategy',
    icon: 'M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16',
    description: 'Strategic planning with goals, action plans, and timelines',
    promptPrefix: 'Write a Strategy Document.',
    sections: [
      'Executive Summary',
      'Current State',
      'Strategic Goals',
      'Action Plan',
      'Timeline',
      'Risks & Mitigations',
    ],
    skeleton:
      '# [Title]\n\n## Executive Summary\n\n## Current State\n\n## Strategic Goals\n\n## Action Plan\n\n## Timeline\n\n## Risks & Mitigations\n',
  },
  {
    id: 'analysis',
    name: 'Analysis',
    icon: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0zM10 7v6m-3-3h6',
    description: 'Data-driven analysis with findings and recommendations',
    promptPrefix: 'Write an Analysis Document.',
    sections: [
      'Summary',
      'Methodology',
      'Data',
      'Findings',
      'Recommendations',
      'Next Steps',
    ],
    skeleton:
      '# [Title]\n\n## Summary\n\n## Methodology\n\n## Data\n\n## Findings\n\n## Recommendations\n\n## Next Steps\n',
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    description: 'Structured meeting notes with agenda and action items',
    promptPrefix: 'Write Meeting Notes.',
    sections: [
      'Attendees',
      'Agenda',
      'Discussion',
      'Action Items',
      'Decisions',
      'Follow-ups',
    ],
    skeleton:
      '# [Title]\n\n## Attendees\n\n## Agenda\n\n## Discussion\n\n## Action Items\n\n## Decisions\n\n## Follow-ups\n',
  },
  {
    id: 'blank',
    name: 'Blank',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
    description: 'Start from scratch with just your prompt',
    promptPrefix: 'Write a document based on the following description.',
    sections: [],
    skeleton: '',
  },
];
