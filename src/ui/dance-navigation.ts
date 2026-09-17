import type { Dance } from '../model.ts';
import { $ } from './dom.ts';

/** Navigation owns its presentation; the player owns dance state. */
export function createDanceNavigation(dances: readonly Dance[], onSelect: (id: string) => void) {
  const sidebar = $('#sidebar');
  const nav = $('#dance-navigation');
  const toggle = $<HTMLButtonElement>('#sidebar-toggle');
  const narrow = window.matchMedia('(max-width: 680px)');
  const buttons = new Map<string, HTMLButtonElement>();
  const groups = [['chain', 'Chain & line'], ['circle', 'Circle'], ['couple', 'Couple'], ['set', 'Set']] as const;
  for (const [category, title] of groups) {
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    heading.id = `group-${category}`;
    heading.textContent = title;
    section.setAttribute('aria-labelledby', heading.id);
    const list = document.createElement('ul');
    for (const dance of dances.filter(d => d.category === category)) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = dance.title;
      button.dataset.dance = dance.id;
      button.addEventListener('click', () => {
        onSelect(dance.id);
        if (narrow.matches) { setExpanded(false); toggle.focus(); }
      });
      item.append(button);
      list.append(item);
      buttons.set(dance.id, button);
    }
    section.append(heading, list);
    nav.append(section);
  }
  function setExpanded(expanded: boolean) {
    document.body.classList.toggle('sidebar-collapsed', !expanded);
    nav.hidden = !expanded;
    $('#sidebar-label').hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'Collapse dance list' : 'Expand dance list');
    toggle.title = expanded ? 'Collapse dance list' : 'Expand dance list';
  }
  toggle.addEventListener('click', () => setExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
  sidebar.addEventListener('keydown', event => {
    if (event.key === 'Escape') { setExpanded(false); toggle.focus(); }
  });
  narrow.addEventListener('change', () => setExpanded(!narrow.matches));
  setExpanded(!narrow.matches);
  return {
    setActive(id: string) {
      for (const [danceId, button] of buttons) {
        if (danceId === id) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      }
    },
  };
}
