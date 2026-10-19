// Single source of truth for everything content-related on the page.
// Edit this file to change links, crew members, skills or copy — no HTML edits needed.

export const PROFILE = {
  name: 'GHASSAN MAZEN',
  handle: '@ghassan.shk',
  // Drop your real photo at this path and it shows up everywhere automatically.
  photo: 'assets/img/ghassan.jpg',
  // Shown if the photo above is missing, and on the back of the hero portrait.
  pixelAvatar: 'https://i.postimg.cc/9Xvbc3sw-/7eed46e2-854a-46dd-a073-c66409387f95.png',
  roles: [
    'Full-stack developer',
    'Web & app builder',
    'Systems for business',
    'Backend & frontend',
    'Automation & AI'
  ],
  tagline: 'I build the websites, apps and systems businesses actually run on — and I ship them fast.',
  bio: [
    'I take a product from idea to live: the interface people touch, the backend holding it up, ' +
      'and the plumbing in between. Websites, web apps, admin panels, APIs, automations, AI features.',
    'I move fast because I use AI the way a good contractor uses power tools — it removes the slow ' +
      'parts, not the thinking. Scope and price are agreed before anything is built, you watch it ' +
      'come together on a live link, and the code is yours at the end.',
    'This site is the sample. The editor, the live guestbook, the encrypted vault — all hand-built, ' +
      'all running in production, no page builder involved. Press ⌘K / Ctrl+K to move around.'
  ],
  facts: [
    { label: 'Availability', value: 'Open — 1–2 projects' },
    { label: 'Works with', value: 'Founders · small teams · local business' },
    { label: 'Engagement', value: 'Fixed scope, flat price' },
    { label: 'Reply time', value: 'Within a day' },
    { label: 'Based', value: 'Remote — any time zone' },
    { label: 'Languages', value: 'English · العربية' }
  ],
  skills: [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'HTML & CSS',
    'Firebase', 'Supabase', 'REST APIs', 'SQL', 'Git', 'Linux',
    'Networking', 'UI design', 'Automation', 'AI integration'
  ]
};

/* What I build — the offer, in plain language. */
export const CAPABILITIES = [
  {
    icon: '◧',
    title: 'Web apps',
    blurb:
      'Dashboards, booking flows, member portals, client areas. Real accounts, real data, ' +
      'real permissions — not a pretty mockup that falls over on the second user.',
    tags: ['Auth & roles', 'Live data', 'Payments', 'Dashboards']
  },
  {
    icon: '◨',
    title: 'Websites & landing pages',
    blurb:
      'Fast, responsive, and built to be found. Clean markup, proper metadata, images that ' +
      'do not blow up on mobile data, and a page you can actually edit later.',
    tags: ['Responsive', 'SEO & OG', 'Fast loads', 'Editable']
  },
  {
    icon: '◰',
    title: 'Backend & APIs',
    blurb:
      'The part nobody sees and everybody depends on. Databases, endpoints, authentication, ' +
      'webhooks, scheduled jobs, and integrations with the tools you already pay for.',
    tags: ['Databases', 'REST APIs', 'Webhooks', 'Integrations']
  },
  {
    icon: '◱',
    title: 'Systems for business',
    blurb:
      'Inventory, invoicing, orders, bookings, a lightweight CRM, an admin panel for your team. ' +
      'Usually this replaces a spreadsheet that three people are fighting over.',
    tags: ['Admin panels', 'Inventory', 'Invoicing', 'Reporting']
  },
  {
    icon: '◲',
    title: 'Automation',
    blurb:
      'The repetitive hour in your week, deleted. Data moved between tools, reports generated ' +
      'and sent, files processed, alerts raised before a customer notices.',
    tags: ['Scripts', 'Scheduled jobs', 'Reports', 'Alerts']
  },
  {
    icon: '◳',
    title: 'AI features',
    blurb:
      'Assistants that answer from your own documents, text that gets summarised, classified or ' +
      'translated, support that triages itself. Wired into what you already run.',
    tags: ['Chat assistants', 'Doc Q&A', 'Summarising', 'Bilingual']
  }
];

/* Selected work — everything here is live and was built by hand. No stock projects. */
export const WORK = [
  {
    title: 'The Vault',
    kind: 'Interactive product',
    status: 'live',
    blurb:
      'A five-chamber puzzle where each answer is the decryption key to the next chamber. ' +
      'Nothing is validated against a stored answer — a wrong key simply fails to decrypt, ' +
      'so the puzzle cannot be read out of the page source.',
    points: ['AES-GCM + PBKDF2 in the browser', 'Zero backend, zero leaks', 'Custom canvas ember field'],
    href: 'vault/',
    cta: 'Open the vault'
  },
  {
    title: 'This site',
    kind: 'Front-end engineering',
    status: 'live',
    blurb:
      'Hand-written: no framework, no build step, no template. Modular ES modules, a design-token ' +
      'system with five accent themes, a command palette, scroll-spy navigation and reduced-motion ' +
      'support throughout.',
    points: ['Design tokens & theming', 'Command palette (⌘K)', 'Accessible, keyboard-complete'],
    href: 'https://github.com/GhassanMazen00/GhassanMazen00',
    cta: 'Read the source'
  },
  {
    title: 'Pixel Studio',
    kind: 'Canvas application',
    status: 'live',
    blurb:
      'A full drawing tool in the page: brush, fill, mirror modes, an undo stack, variable canvas ' +
      'sizes, PNG export and autosave. Strokes are interpolated so fast drags never leave gaps.',
    points: ['Undo/redo history', 'Mirror & fill tools', 'Autosaves locally'],
    href: '#studio',
    cta: 'Draw something'
  },
  {
    title: 'Live guestbook & gallery',
    kind: 'Realtime backend',
    status: 'live',
    blurb:
      'Messages and submitted artwork appear for every visitor the moment they are posted, with ' +
      'search, pagination, posting cooldowns and a moderation view behind an admin gate.',
    points: ['Realtime database', 'Rate limiting', 'Admin moderation'],
    href: '#guestbook',
    cta: 'Sign it'
  },
  {
    title: 'Bilingual AI assistant',
    kind: 'Streaming AI chat',
    status: 'soon',
    blurb:
      'A streaming chat assistant that handles Arabic and English in the same conversation, ' +
      'detecting direction per message so right-to-left text lays out correctly. ' +
      'Currently being rebuilt on a new provider.',
    points: ['Token streaming', 'Arabic + English, RTL-aware', 'Built for mobile first'],
    href: 'ai/',
    cta: 'Coming soon'
  }
];

/* How a project actually runs. Removes the usual unknowns before anyone asks. */
export const PROCESS = [
  {
    step: '01',
    title: 'Scope',
    body:
      'One conversation: what it has to do, who uses it, what finished looks like. ' +
      'You get a written scope and a flat price before a line is written.'
  },
  {
    step: '02',
    title: 'Build in the open',
    body:
      'Work goes up on a live link as it lands, not in a reveal at the end. ' +
      'You redirect early, while changing direction is still cheap.'
  },
  {
    step: '03',
    title: 'Ship',
    body:
      'Deployed to your domain, on your accounts, with the repository handed over. ' +
      'You own the code and can take it anywhere — no lock-in, no hostage situation.'
  },
  {
    step: '04',
    title: 'Aftercare',
    body:
      'Two weeks of fixes included after launch. Longer support or a second phase ' +
      'is a separate, equally clear agreement.'
  }
];

/* The availability panel — a clear door, not a sales pitch. */
export const ENGAGEMENT = {
  status: 'Open for projects',
  headline: 'Got something that needs building?',
  body:
    'I take on one or two projects at a time so each one gets real attention. ' +
    'Tell me what you need and what it has to do — if it is a fit you get a scope ' +
    'and a price, and if it is not, I will say so and point you somewhere better.',
  email: 'ghassanmazen@zohomail.com',
  notes: [
    { label: 'Good fit', value: 'Web apps, sites, internal tools, automations, AI features' },
    { label: 'Terms', value: 'Fixed scope and flat price, agreed before work starts' },
    { label: 'Handover', value: 'Code, repository and accounts are yours' }
  ]
};

export const SOCIALS = [
  {
    id: 'github',
    name: 'GitHub',
    handle: 'GhassanMazen00',
    url: 'https://github.com/GhassanMazen00/GhassanMazen00',
    blurb: 'Code, experiments, this site',
    icon: 'github'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@ghassan.shk',
    url: 'https://www.instagram.com/ghassan.shk/',
    blurb: 'Life in squares',
    icon: 'instagram'
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    handle: 'Add me',
    url: 'https://t.snapchat.com/p3KLzoLR',
    blurb: 'Disappearing nonsense',
    icon: 'snapchat'
  },
  {
    id: 'email',
    name: 'Email',
    handle: 'ghassanmazen@zohomail.com',
    url: 'mailto:ghassanmazen@zohomail.com',
    blurb: 'For the serious stuff',
    icon: 'mail'
  }
];

export const CREW = [
  {
    name: 'LOAI_ABB',
    url: 'https://www.instagram.com/loai_abb/',
    avatar: 'https://i.postimg.cc/XqLnjRMS/20250819-2117-Pixel-Ginger-Character-simple-compose-01k31rss70fmktq7sny215zh9h.png',
    role: 'The Ginger'
  },
  {
    name: 'OSAIDJANO',
    url: 'https://www.instagram.com/osaidjano/',
    avatar: 'https://i.postimg.cc/JhH7NYXZ/20250819-2129-Pixel-Man-with-T-Shirt-simple-compose-01k31scc2efvfbt02vce5hkp5r.png',
    role: 'The Regular'
  },
  {
    name: 'LOAI_KASHKASH',
    url: 'https://www.instagram.com/loai_kashkash/',
    avatar: 'https://i.postimg.cc/76gxcCmL/20250819-2136-Pixel-Fat-Man-simple-compose-01k31sw-dygemgba9w7vm7tmpq5.png',
    role: 'The Unit'
  },
  {
    name: 'KHALID.ALFARES1',
    url: 'https://www.instagram.com/khalid.alfares1/',
    avatar: 'https://i.postimg.cc/d1Ms4RRX/20250819-2140-Pixel-Man-with-Flag-simple-compose-01k31t39ykee6bbh3fcc1xfhjv-removebg-preview.png',
    role: 'The Patriot'
  },
  {
    name: 'BADR_SANOUFI',
    url: 'https://www.instagram.com/badr_sanoufi/',
    avatar: 'https://i.postimg.cc/j2tsrsF4/assets-task-01k31taeamf6tavtp3htwn6b2h-1755629076-img-0.webp',
    role: 'The Wildcard'
  }
];

// Lines the hero portrait says when you poke it.
export const DIALOGUES = [
  'Welcome. Everything here was built by hand.',
  'Scroll down if you came to hire someone.',
  'Try the pixel studio — it has undo now.',
  'The oracle knows things. Ask it.',
  'Press ⌘K. Trust me.',
  'Sign the guestbook before you leave.',
  'Up up down down left right left right B A.',
  'Yes, that is my real face.'
];
