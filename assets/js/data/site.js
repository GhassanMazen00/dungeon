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
    'This site is the sample — the drawing tool, the live guestbook, the whole thing is hand-built, ' +
      'no framework and no page builder. Press ⌘K / Ctrl+K to move around.'
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
