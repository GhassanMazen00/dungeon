// Renders the data-driven sections: capabilities, work, process, about,
// socials, crew and the contact panel.

import { PROFILE, SOCIALS, CREW, CAPABILITIES, WORK, PROCESS, ENGAGEMENT } from '../data/site.js';
import { el, qs, toast } from '../core/dom.js';
import { icon } from '../core/icons.js';

function renderCapabilities() {
  const host = qs('#capGrid');
  if (!host) return;

  host.replaceChildren(
    ...CAPABILITIES.map((cap) =>
      el(
        'article',
        { class: 'cap' },
        el('span', { class: 'cap__mark', text: cap.icon, 'aria-hidden': 'true' }),
        el('h3', { class: 'cap__title', text: cap.title }),
        el('p', { class: 'cap__blurb', text: cap.blurb }),
        el('div', { class: 'cap__tags' }, ...cap.tags.map((tag) => el('span', { class: 'chip', text: tag })))
      )
    )
  );
}

function renderWork() {
  const host = qs('#workGrid');
  if (!host) return;

  host.replaceChildren(
    ...WORK.map((item) => {
      const external = /^https?:/.test(item.href);
      const soon = item.status === 'soon';

      return el(
        'article',
        { class: `work-card${soon ? ' is-soon' : ''}` },
        el(
          'header',
          { class: 'work-card__top' },
          el('span', { class: 'work-card__kind', text: item.kind }),
          el('span', {
            class: `work-card__status work-card__status--${item.status}`,
            text: soon ? 'in progress' : 'live'
          })
        ),
        el('h3', { class: 'work-card__title', text: item.title }),
        el('p', { class: 'work-card__blurb', text: item.blurb }),
        el(
          'ul',
          { class: 'work-card__points' },
          ...item.points.map((point) => el('li', { text: point }))
        ),
        el('a', {
          class: 'work-card__cta',
          href: item.href,
          target: external ? '_blank' : null,
          rel: external ? 'noopener noreferrer' : null,
          text: `${item.cta} →`
        })
      );
    })
  );
}

function renderProcess() {
  const host = qs('#processList');
  if (!host) return;

  host.replaceChildren(
    ...PROCESS.map((stage) =>
      el(
        'li',
        { class: 'step' },
        el('span', { class: 'step__num', text: stage.step }),
        el('h3', { class: 'step__title', text: stage.title }),
        el('p', { class: 'step__body', text: stage.body })
      )
    )
  );
}

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
  renderCapabilities();
  renderWork();
  renderProcess();
  renderAbout();
  renderSocials();
  renderCrew();
  renderContact();
}
