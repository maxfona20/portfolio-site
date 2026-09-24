/*
 * Project facts are drawn from Maximilian Fona's resume and existing portfolio.
 * Any standalone demos shown alongside these case studies are illustrative.
 * They are not screenshots of the original applications or production services.
 */
window.PORTFOLIO_PROJECTS = [
  {
    id: 'manoo',
    category: 'web',
    index: '01',
    title: 'Manoo rental marketplace',
    shortTitle: 'Manoo',
    context: 'Technical internship · Team project',
    summary: 'A rental marketplace that connects neighbors through item listings, payments, and local pickup hubs.',
    tags: ['React', 'JavaScript', 'UI/UX', 'Gamification'],
    role: 'Technical Intern',
    bullets: [
      'Built marketplace features with the team, including listings, in-app payments, and hub pickup and dropoff.',
      'Implemented XP, levels, streaks, achievements, and leaderboards.',
      'Refined the component design system, branding, and interactive features using stakeholder feedback.',
      'Contributed to carbon footprint tracking that measures and visualizes users’ environmental impact.'
    ],
    takeaway: 'Product work that brings interface design, application logic, and team feedback together.',
    previewLabel: 'Marketplace interface study',
    accent: 'mint'
  },
  {
    id: 'flask',
    category: 'systems',
    index: '02',
    title: 'Dockerized Flask microservices',
    shortTitle: 'Flask services',
    context: 'CSE 380 · Michigan State',
    summary: 'A containerized application with separate services for users, documents, full-text search, and logging.',
    tags: ['Python', 'Flask', 'Docker', 'REST APIs', 'JWT'],
    role: 'Student developer',
    bullets: [
      'Built a microservices application using Flask, Docker, and REST APIs.',
      'Implemented JWT authentication and communication between services.',
      'Created services for user management, document handling, full-text search, and logging.',
      'Applied security principles centered on confidentiality, integrity, and availability.'
    ],
    takeaway: 'A look at how service boundaries, authentication, and containers fit into one application.',
    previewLabel: 'Interactive architecture study',
    accent: 'blue'
  },
  {
    id: 'venmo',
    category: 'mobile',
    index: '03',
    title: 'Mock Venmo app',
    shortTitle: 'Mock Venmo',
    context: 'Independent project · iOS prototype',
    summary: 'A SwiftUI interface prototype with simulated payment flows, transaction history, and user profiles.',
    tags: ['Swift', 'SwiftUI', 'State management', 'Accessibility'],
    role: 'Designer and developer',
    bullets: [
      'Recreated payment transfer flows, transaction history, and profile screens with clear navigation.',
      'Built custom components and animations with attention to visual hierarchy and responsive layouts.',
      'Practiced state management, accessibility, and user flow design.',
      'Kept payments simulated as part of a front-end learning project.'
    ],
    takeaway: 'An interface study focused on making state changes and common actions easy to follow.',
    previewLabel: 'Payment flow interface study',
    accent: 'lilac'
  },
  {
    id: 'ai',
    category: 'creative',
    index: '04',
    title: 'AI media, from script to screen',
    shortTitle: 'AI Media',
    context: 'Independent project · Founder and manager',
    summary: 'An Instagram account I grew to more than 40,000 followers, managing the content from the first script through publishing.',
    tags: ['Leonardo AI', 'Hedra', 'ElevenLabs', 'Kling AI', 'CapCut'],
    role: 'Founder and content producer',
    bullets: [
      'Managed content strategy, production, publishing, and audience growth.',
      'Built an AI content workflow for a recurring short video series.',
      'Developed an AI news broadcast format with scripting, generated visuals and voice, and editing.',
      'Independently maintained the content calendar and publishing schedule.'
    ],
    takeaway: 'A creative project that combines new tools with the consistency needed to build an audience.',
    previewLabel: 'Content production workflow',
    accent: 'amber'
  }
];
