// Renders the data-driven sections: about, socials, crew and the contact panel.

import { PROFILE, SOCIALS, CREW, ENGAGEMENT } from '../data/site.js';
import { el, qs, toast } from '../core/dom.js';
import { icon } from '../core/icons.js';

function renderContact() {
  const status = qs('#engageStatus');
  if (status) status.textContent = ENGAGEMENT.status;

  const headline = qs('#engageHeadline');
  if (headline) headline.textContent = ENGAGEMENT.headline;

  const body = qs('#engageBody');
  if (body) body.textContent = ENGAGEMENT.body;

  const notes = qs('#engageNotes');
  if (notes) {
    notes.replaceChildren(
      ...ENGAGEMENT.notes.map((note) =>
        el(
          'div',
          { class: 'note-row' },
          el('span', { class: 'note-row__label', text: note.label }),
          el('span', { class: 'note-row__value', text: note.value })
        )
      )
    );
  }

  const mail = qs('#engageMail');
  if (mail) {
    mail.href = `mailto:${ENGAGEMENT.email}?subject=${encodeURIComponent('Project enquiry')}`;
  }

  // The address lives on its own line — in a button it overflows the card on a phone.
  const addr = qs('#engageAddress');
  if (addr) {
    addr.textContent = ENGAGEMENT.email;
    addr.href = `mailto:${ENGAGEMENT.email}`;
  }

  qs('#btnCopyMail')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(ENGAGEMENT.email);
      toast('Address copied.', 'ok');
    } catch {
      // Clipboard blocked (insecure context or denied) — the address is on
      // screen anyway, so just say so rather than failing silently.
      toast('Copy blocked — the address is on the button.', 'info');
    }
  });
}

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
  renderContact();
}
