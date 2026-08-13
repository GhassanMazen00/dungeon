// Renders the data-driven sections: about, socials and crew.

import { PROFILE, SOCIALS, CREW } from '../data/site.js';
import { el, qs } from '../core/dom.js';
import { icon } from '../core/icons.js';

function renderAbout() {
  const bio = qs('#aboutBio');
  if (bio) bio.replaceChildren(...PROFILE.bio.map((text) => el('p', { text })));

  const facts = qs('#aboutFacts');
  if (facts) {
    facts.replaceChildren(
      ...PROFILE.facts.map((fact) =>
        el(
          'div',
          { class: 'fact' },
          el('div', { class: 'fact__label', text: fact.label }),
          el('div', { class: 'fact__value', text: fact.value })
        )
      )
    );
  }

  const skills = qs('#aboutSkills');
  if (skills) {
    skills.replaceChildren(...PROFILE.skills.map((skill) => el('span', { class: 'chip', text: skill })));
  }
}

function renderSocials() {
  const host = qs('#socialGrid');
  if (!host) return;

  host.replaceChildren(
    ...SOCIALS.map((social) =>
      el(
        'a',
        {
          class: 'social',
          href: social.url,
          target: social.url.startsWith('mailto:') ? null : '_blank',
          rel: 'noopener noreferrer'
        },
        el('span', { class: 'social__icon', html: icon(social.icon) }),
        el(
          'span',
          { class: 'social__text' },
          el('span', { class: 'social__name', text: social.name }),
          el('span', { class: 'social__handle', text: social.handle })
        )
      )
    )
  );
}

function renderCrew() {
  const host = qs('#crewGrid');
  if (!host) return;

  host.replaceChildren(
    ...CREW.map((member) =>
      el(
        'a',
        { class: 'crew__card', href: member.url, target: '_blank', rel: 'noopener noreferrer' },
        el('img', {
          class: 'crew__avatar',
          src: member.avatar,
          alt: member.name,
          loading: 'lazy',
          decoding: 'async'
        }),
        el('span', { class: 'crew__name', text: member.name }),
        el('span', { class: 'crew__role', text: member.role })
      )
    )
  );
}

export function initContent() {
  renderAbout();
  renderSocials();
  renderCrew();
}
