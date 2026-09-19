/**
 * Vue de dialogue : HTML/CSS pur, posee dans le meme conteneur que le HUD
 * tactique (voir `src/ui/hud.ts`, meme construction du DOM). Aucune
 * dependance a `three`.
 *
 * Refonte "Encre rouge" (docs/art/UI-DESIGN-SYSTEM.md, sections "Portraits",
 * "Écrans > Dialogue", "Transition de scène", "Mouvement") : panneau ancre en
 * bas, decor de scene en haut, portrait hero du dernier locuteur, tampon de
 * jet, transition de scene. La liste du hub (choix du cadet a qui parler) est
 * un ecran a part entiere depuis le lot "Hub — l'alignement" : voir
 * `src/ui/hubView.ts`. Cette vue ne rend plus que les CONVERSATIONS (scenes
 * `dialogue` et conversation d'un cadet choisi au hub).
 */

import { portraitElement, portraitFor } from '@/ui/portraits';
import { backdropMarkup, sceneZone, splitTitle } from '@/ui/sceneChrome';
import { DIFFICULTY_LABELS } from '@/rules/attributes';
import type { PresentedChoice, PresentedNode, PresentedRoll, RadioCue, SpeakerId } from '@/narrative';

export interface NarrativeViewCallbacks {
  onChoose(index: number): void;
  onAdvance(): void;
  /** Resout le jet de reflexion du noeud courant (ADR 0012) -- voir `ChapterApp.rollInsight`. */
  onRollInsight(): void;
  /** Depense `n` points de Chance sur le jet en attente (ADR 0015 §2) -- voir `ChapterApp.spendLuck`. */
  onSpendLuck(n: number): void;
  /** Accepte l'echec du jet en attente, sans depenser de Chance (ADR 0015 §2) -- voir `ChapterApp.acceptRoll`. */
  onAcceptRoll(): void;
  /**
   * Met en scene `roll` (deja tire par le Rng) avec le de 3D -- voir
   * `src/render/diceAdapter.ts`. `src/ui` ne connait que cette interface,
   * jamais `three` (regle 2 d'AGENTS.md) : l'implementation reelle vit dans
   * `src/chapter.ts`. Resout une fois la mise en scene terminee (ou
   * immediatement si les des sont desactives, `?dice=0`).
   */
  playRoll(roll: PresentedRoll, label: string): Promise<void>;
  /** Ferme immediatement toute mise en scene en cours (voir `render`, "rendu perime"). */
  cancelRoll(): void;
}

/**
 * Numero de scene (1 a 9) affiche par la carte de titre, "Scène n / 9"
 * (docs/art/UI-DESIGN-SYSTEM.md, section "Transition de scène"). Recopie de
 * l'ordre de docs/design/03-CHAPTER-1.md : le parcours interieur (salles 1 a
 * 3) est une seule scene (la 7) deployee en trois entrees dans
 * CHAPTER_1_SCENES (sceneRouter.ts), et le combat tactique (scene 8) ne passe
 * jamais par cette vue -- absent de la table, sans consequence.
 */
const SCENE_NUMBERS: Record<string, number> = {
  'ch1.intro': 1,
  'ch1.discours': 2,
  'ch1.exam': 3,
  'ch1.tirage': 4,
  'ch1.hub': 5,
  'ch1.fourgon': 6,
  'ch1.salle1': 7,
  'ch1.salle2': 7,
  'ch1.salle3': 7,
  'ch1.affrontement': 8,
  'ch1.bal': 9,
};
const TOTAL_SCENES = 9;

const SCENE_CARD_MS = 1200;
const SCENE_CARD_REDUCED_MS = 600;
const RADIO_CUE_MS = 6000;
const RADIO_MAX = 3;
const HERO_CROSSFADE_MS = 160;

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Le prefixe "[Competence]" des donnees ne s'affiche jamais tel quel : il devient la puce a droite. */
function stripCheckPrefix(text: string): string {
  return text.replace(/^\[[^\]]+]\s*/, '');
}

/**
 * Chaine de des lisible, avec le detail d'une explosion/implosion :
 * "Dé 1 → implosion −6 = −5" plutot qu'une simple liste de faces -- la
 * relance ET son signe doivent se lire, pas seulement le resultat final.
 */
function dieChainText(roll: PresentedRoll): string {
  const [first, ...rest] = roll.dieFaces;
  if (rest.length === 0) return `Dé ${first}`;
  const kind = roll.exploded ? 'explosion' : 'implosion';
  const sign = roll.exploded ? '+' : '−';
  const tail = rest.map((f) => `${sign}${f}`).join(' ');
  return `Dé ${first} → ${kind} ${tail} = ${roll.dieValue}`;
}

function modifiersText(roll: PresentedRoll): string {
  return roll.modifiers.map((m) => `${m.label} ${m.value >= 0 ? '+' : ''}${m.value}`).join(' · ');
}

/**
 * Libelle francais d'une DV nommee (`DifficultyName`, ex. `TRES_DIFFICILE`) --
 * jamais la constante technique brute a l'ecran (voir `DIFFICULTY_LABELS`,
 * `src/rules/attributes.ts`). Repli sur la valeur brute si elle est inconnue :
 * une donnee invalide ne doit jamais faire disparaitre l'indication.
 */
function dvName(dvLabel: string): string {
  return (DIFFICULTY_LABELS as Record<string, string>)[dvLabel] ?? dvLabel;
}

/**
 * Reste de la ligne apres la chaine de des : attribut, competence,
 * modificateurs nommes s'il y en a, puis total contre DV nommee. Format
 * impose par la revue visuelle : "INT 8 · Piratage 6 · total 9 contre DV 13
 * (normale)" -- jamais un total sans le detail qui l'explique. La DV nommee
 * est en minuscules ici (elle qualifie le total, milieu de phrase), en casse
 * normale dans la puce de jet (`chip-check__dv`, voir `renderChoices`/`renderInsight`).
 */
function rollDetailText(roll: PresentedRoll): string {
  const parts = [`${roll.attribute} ${roll.attributeValue}`, `${roll.skillLabel} ${roll.skillValue}`];
  const mods = modifiersText(roll);
  if (mods) parts.push(mods);
  parts.push(`total ${roll.total} contre DV ${roll.dv} (${dvName(roll.dvLabel).toLowerCase()})`);
  return parts.join(' · ');
}

export class NarrativeView {
  private readonly root: HTMLElement;
  private readonly sceneNameEl: HTMLElement;
  private readonly radioStackEl: HTMLElement;
  private readonly heroFrameEl: HTMLElement;
  private readonly heroPortraitsEl: HTMLElement;
  private readonly heroNameEl: HTMLElement;
  private readonly narrationEl: HTMLElement;
  private readonly linesEl: HTMLElement;
  private readonly offscreenEl: HTMLElement;
  private readonly stampEl: HTMLElement;
  private readonly luckEl: HTMLElement;
  private readonly insightEl: HTMLElement;
  private readonly choicesEl: HTMLElement;
  private readonly advanceEl: HTMLButtonElement;
  private readonly sceneCardEl: HTMLElement;

  private lastSceneId: string | null = null;
  private heroSpeaker: SpeakerId | null = null;
  /** Reference du dernier jet (choix a jet ordinaire) deja "vu" -- sert a detecter un NOUVEAU jet. */
  private seenCheck: PresentedRoll | null = null;
  /** Id du noeud ou ce jet a ete resolu : la carte de resultat ne s'affiche que sur CE noeud. */
  private checkNodeId: string | null = null;
  /**
   * Jet (check ordinaire OU jet de reflexion, ADR 0012) actuellement en cours
   * de mise en scene -- tant qu'il n'est pas egal a `revealedRoll`, le noeud
   * reste hors champ (choix verrouilles ou contenu du noeud d'arrivee non
   * encore rendu). Un seul jet a la fois : les deux mecanismes partagent ce
   * champ, ils ne peuvent jamais etre actifs simultanement sur un meme noeud.
   */
  private animatingRoll: PresentedRoll | null = null;
  /** Jet dont la mise en scene est terminee et le resultat revele a l'ecran. */
  private revealedRoll: PresentedRoll | null = null;
  /** Dernier noeud rendu : reutilise pour rejouer `render()` une fois une mise en scene terminee. */
  private currentNode: PresentedNode | null = null;
  private currentSceneTitle = '';
  private currentSceneId = '';
  /** Incremente a chaque `render()` : detecte un rendu externe perime pendant qu'une mise en scene tourne. */
  private renderToken = 0;
  private sceneCardTimer: number | undefined;
  private readonly radioTimers = new Map<HTMLElement, number>();

  constructor(
    container: HTMLElement,
    private readonly callbacks: NarrativeViewCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'narrative scene-shell';
    this.root.innerHTML = `
      ${backdropMarkup()}
      <div class="narrative-scene-tag" data-testid="scene-title">
        <h1 class="narrative-scene-name"></h1>
      </div>
      <div class="narrative-radio-stack" data-testid="radio"></div>
      <div class="narrative-panel-wrap">
        <div class="narrative-hero-frame" data-testid="hero" hidden>
          <div class="narrative-hero-portraits"></div>
          <p class="narrative-hero-name"></p>
        </div>
        <div class="narrative-panel panel">
          <p class="narrative-text" data-testid="narration" hidden></p>
          <div class="narrative-lines" data-testid="lines"></div>
          <div class="narrative-offscreen" data-testid="offscreen-log" hidden></div>
          <div class="narrative-rollcard" data-testid="roll" hidden></div>
          <div class="narrative-luck" data-testid="luck" hidden></div>
          <div class="narrative-insight" data-testid="insight" hidden></div>
          <div class="narrative-choices" data-testid="choices"></div>
          <button type="button" class="narrative-advance btn btn--primary" data-testid="advance" hidden></button>
        </div>
      </div>
      <div class="narrative-scene-card" data-testid="scene-card" hidden></div>
    `;
    container.appendChild(this.root);

    this.sceneNameEl = this.q('.narrative-scene-name');
    this.radioStackEl = this.q('[data-testid="radio"]');
    this.heroFrameEl = this.q('[data-testid="hero"]');
    this.heroPortraitsEl = this.q('.narrative-hero-portraits');
    this.heroNameEl = this.q('.narrative-hero-name');
    this.narrationEl = this.q('[data-testid="narration"]');
    this.linesEl = this.q('[data-testid="lines"]');
    this.offscreenEl = this.q('[data-testid="offscreen-log"]');
    this.stampEl = this.q('[data-testid="roll"]');
    this.luckEl = this.q('[data-testid="luck"]');
    this.insightEl = this.q('[data-testid="insight"]');
    this.choicesEl = this.q('[data-testid="choices"]');
    this.advanceEl = this.q('[data-testid="advance"]') as HTMLButtonElement;
    this.sceneCardEl = this.q('[data-testid="scene-card"]');

    this.sceneCardEl.addEventListener('click', () => this.dismissSceneCard());
    window.addEventListener('keydown', this.onKeyDown);
  }

  private q(selector: string): HTMLElement {
    const el = this.root.querySelector(selector);
    if (!el) throw new Error(`Element de NarrativeView introuvable : ${selector}`);
    return el as HTMLElement;
  }

  /**
   * Affiche un noeud de dialogue : narration, repliques, jet, choix ou bouton
   * Continuer. Point d'entree UNIQUE de tout rendu (UI comme debug, voir
   * `ChapterApp.renderDialogue`/`renderHubDialogue`) -- c'est ce qui permet de
   * detecter ici, et nulle part ailleurs, qu'un rendu arrive alors qu'une
   * mise en scene de de est encore en cours (voir la consigne "Debug API/e2e
   * doit rester synchrone" du lot de : `choose()`/`rollInsight()`/`advance()`
   * pilotes hors de l'UI pendant qu'un jet tourne a l'ecran).
   *
   * Deux jets savent se mettre en scene AVANT de reveler leur consequence :
   * - un choix a jet ordinaire (`node.lastCheck`) : le noeud D'ARRIVEE reste
   *   entierement hors champ (rien de nouveau rendu) tant que le de n'a pas
   *   fini de jouer -- voir `ensureRevealed`.
   * - le jet de reflexion d'un noeud a `insight` (ADR 0012) : la question
   *   reste affichee (narration/lignes), seuls le verdict et le choix `best`
   *   restent masques -- voir `renderInsight`.
   */
  render(node: PresentedNode, sceneTitle: string, sceneId = ''): void {
    const token = ++this.renderToken;
    const wasAnimating = this.animatingRoll !== null && this.animatingRoll !== this.revealedRoll;
    this.currentNode = node;
    this.currentSceneTitle = sceneTitle;
    if (sceneId) this.currentSceneId = sceneId;

    if (wasAnimating) {
      // L'etat du jeu a change sous une mise en scene non terminee (test qui
      // pilote l'API directement) : on la ferme plutot que de la laisser
      // orpheline -- jamais un overlay bloque, jamais deux rendus qui se
      // disputent l'ecran (voir docs/process/DEBUG_API.md).
      this.animatingRoll = null;
      this.callbacks.cancelRoll();
    }

    if (sceneId) this.root.dataset.zone = sceneZone(sceneId);
    this.renderSceneTag(sceneTitle);
    this.maybeShowSceneCard(sceneTitle, sceneId);

    const relevantCheck = this.checkJustResolvedThisNode(node);
    if (relevantCheck && this.ensureRevealed(relevantCheck, token, node)) return;

    this.renderHero(node);
    this.renderNarration(node);
    const insight = this.renderInsight(node, token);
    const revealBest = Boolean(insight.reveal) || !node.insight;
    this.renderRollCard(insight.reveal ? insight.reveal.roll : relevantCheck, insight.reveal?.text);
    const luckLocked = this.renderLuckPrompt(node);
    this.renderChoices(node.choices, insight.locked || luckLocked, revealBest);
  }

  /**
   * Invite "Il manque N — dépenser N Chance ?" (ADR 0015 §2) : affichee des
   * que `node.pendingRoll` est present ET que son jet a fini d'etre revele
   * (meme mise en scene que le reste, voir `ensureRevealed` plus haut -- le
   * de rejoue la chaine `pendingRoll.roll.dieFaces` avant que cette invite
   * n'apparaisse). Deux boutons, styles avec les jetons existants : "Dépenser
   * N Chance" (desactive si la Chance disponible ne suffit pas -- filet, ce
   * cas ne devrait pas arriver, le moteur ne propose que des marges
   * couvertes) et "Accepter l'échec". Renvoie `true` tant que l'invite est
   * affichee, pour verrouiller les choix (ADR 0015 §2 : aucune autre reponse
   * ne doit etre selectionnable pendant qu'une decision de Chance est en jeu).
   */
  private renderLuckPrompt(node: PresentedNode): boolean {
    const pending = node.pendingRoll;
    if (!pending) {
      this.luckEl.hidden = true;
      this.luckEl.innerHTML = '';
      return false;
    }

    this.luckEl.hidden = false;
    this.luckEl.innerHTML = `
      <p class="narrative-luck-text">Il manque ${pending.missingBy} — dépenser ${pending.missingBy} Chance ?</p>
      <div class="narrative-luck-actions">
        <button type="button" class="btn btn--primary" data-testid="luck-spend">Dépenser ${pending.missingBy} Chance</button>
        <button type="button" class="btn" data-testid="luck-accept">Accepter l'échec</button>
      </div>
    `;
    const spendBtn = this.luckEl.querySelector('[data-testid="luck-spend"]') as HTMLButtonElement;
    const acceptBtn = this.luckEl.querySelector('[data-testid="luck-accept"]') as HTMLButtonElement;
    spendBtn.disabled = pending.missingBy > pending.luckAvailable;
    spendBtn.addEventListener('click', () => this.callbacks.onSpendLuck(pending.missingBy));
    acceptBtn.addEventListener('click', () => this.callbacks.onAcceptRoll());
    if (!spendBtn.disabled) spendBtn.focus();
    else acceptBtn.focus();
    return true;
  }

  /**
   * Vrai des que `node.lastCheck` vient d'etre resolu EN ENTRANT dans ce
   * noeud precis (premiere fois que cette reference de jet est vue, associee
   * au noeud courant a cet instant) -- meme regle que l'ancienne gestion de
   * la carte de resultat : `lastCheck` reste pose sur TOUS les noeuds
   * suivants une fois un jet resolu, il ne faut la montrer/mettre en scene
   * qu'une seule fois, sur le noeud d'arrivee.
   */
  private checkJustResolvedThisNode(node: PresentedNode): PresentedRoll | null {
    const check = node.lastCheck;
    if (check && check !== this.seenCheck) {
      this.seenCheck = check;
      this.checkNodeId = node.nodeId;
    }
    return check && node.nodeId === this.checkNodeId ? check : null;
  }

  /**
   * Lance (au besoin) la mise en scene d'un jet pas encore revele, et rejoue
   * `render()` du meme noeud une fois termine. Renvoie `true` tant qu'il faut
   * attendre (mise en scene en cours ou tout juste lancee) -- l'appelant
   * garde alors le contenu precedent a l'ecran, sous le scrim du de -- et
   * `false` des que `roll` est deja revele.
   */
  private ensureRevealed(roll: PresentedRoll, token: number, node: PresentedNode): boolean {
    if (roll === this.revealedRoll) return false;
    if (this.animatingRoll !== roll) {
      this.animatingRoll = roll;
      const label = `${roll.skillLabel} — DV ${roll.dv}`;
      void this.callbacks.playRoll(roll, label).then(() => {
        // Un rendu plus recent a deja pris le relais (voir `render`, "rendu
        // perime") : cette mise en scene ne correspond plus a rien, on
        // n'ecrase pas ce qui est deja a l'ecran.
        if (token !== this.renderToken) return;
        this.revealedRoll = roll;
        this.animatingRoll = null;
        this.render(node, this.currentSceneTitle, this.currentSceneId);
      });
    }
    return true;
  }

  /**
   * Titre de scene en une seule ligne ("Salle 1 — La porte et le chien" ->
   * "Salle 1" en --bone-dim puis le nom) : pas de sur-titre en petites
   * capitales espacees, interdit par le document ("Ce qu'on s'interdit").
   */
  private renderSceneTag(sceneTitle: string): void {
    const [room, name] = splitTitle(sceneTitle);
    this.sceneNameEl.innerHTML = room
      ? `<span class="narrative-scene-room">${room}</span> — ${name}`
      : name;
  }

  /** Portrait "hero" : le dernier locuteur du noeud, repli sur `speaker` (fichier) si narration pure. */
  private renderHero(node: PresentedNode): void {
    const lastLine = node.lines[node.lines.length - 1];
    const speaker = lastLine?.who ?? node.speaker;
    if (!speaker) {
      // Aucun locuteur determinable (narration seule, sans `speaker` de fichier) :
      // on garde le dernier portrait affiche plutot que de faire clignoter le hero.
      return;
    }
    if (speaker === this.heroSpeaker) return;
    this.heroSpeaker = speaker;

    const spec = portraitFor(speaker);
    this.heroFrameEl.hidden = false;
    this.heroNameEl.textContent = spec.name;
    this.heroNameEl.style.color = spec.color;
    this.heroNameEl.style.borderBottomColor = spec.color;

    // Fondu croise 160ms (section "Mouvement") : le nouveau portrait se pose
    // par-dessus l'ancien puis celui-ci est retire une fois la transition finie.
    const el = portraitElement(speaker, 'hero');
    el.classList.add('narrative-hero-portrait', 'is-entering');
    const previous = Array.from(this.heroPortraitsEl.children);
    this.heroPortraitsEl.appendChild(el);
    requestAnimationFrame(() => el.classList.remove('is-entering'));
    window.setTimeout(
      () => previous.forEach((p) => p.remove()),
      reducedMotion() ? 0 : HERO_CROSSFADE_MS + 40,
    );
  }

  private renderNarration(node: PresentedNode): void {
    this.narrationEl.textContent = node.text ?? '';
    this.narrationEl.hidden = !node.text;

    this.linesEl.innerHTML = '';
    let lastWho: SpeakerId | null = null;
    node.lines.forEach((line, i) => {
      const spec = portraitFor(line.who);
      // Repliques consecutives du meme locuteur (docs/art/UI-DESIGN-SYSTEM.md,
      // revue visuelle) : vignette + nom uniquement sur la premiere ligne de la
      // serie, les suivantes s'alignent sous le texte -- un filet de la couleur
      // du personnage, a la place de la vignette, garde le lien visible avec le
      // portrait au-dessus.
      const continued = line.who === lastWho;
      lastWho = line.who;

      const row = document.createElement('p');
      row.className = continued ? 'narrative-line narrative-line--continued' : 'narrative-line';
      row.style.setProperty('--line-delay', `${i * 90}ms`);
      if (continued) {
        const spacer = document.createElement('span');
        spacer.className = 'narrative-line-spacer';
        spacer.style.setProperty('--speaker-color', spec.color);
        row.appendChild(spacer);
      } else {
        row.appendChild(portraitElement(line.who, 'thumb'));
      }
      const body = document.createElement('span');
      body.className = 'narrative-line-body';
      const text = document.createElement('span');
      text.className = 'narrative-line-text';
      text.textContent = line.text;
      if (continued) {
        body.appendChild(text);
      } else {
        const name = document.createElement('strong');
        name.className = 'narrative-line-name';
        name.style.color = spec.color;
        name.style.borderBottomColor = spec.color;
        name.textContent = spec.name;
        body.append(name, document.createTextNode(' '), text);
      }
      row.appendChild(body);
      this.linesEl.appendChild(row);
    });
  }

  /**
   * Carte de resultat, DANS le flux du panneau (jamais en surcouche qui
   * cacherait le texte -- correctif de la revue visuelle) : RÉUSSI/ÉCHEC,
   * chaine de des avec sa relance nommee, attribut/competence/modificateurs,
   * total contre DV nommee. Partagee entre un choix a jet ordinaire
   * (`node.lastCheck`, appelant passe `verdictText` absent) et le jet de
   * reflexion de l'examen une fois revele (`node.insight.roll`, ADR 0012,
   * `verdictText` = successText/failureText) -- meme mise en scene pour les
   * deux, voir `render`. Reste affichee jusqu'au noeud suivant, sans geste de
   * fermeture dedie.
   */
  private renderRollCard(check: PresentedRoll | null, verdictText?: string): void {
    this.stampEl.hidden = !check;
    if (!check) {
      this.stampEl.innerHTML = '';
      return;
    }

    const verdictClass = check.success ? 'stamp--ok' : 'stamp--ko';
    const verdictLabel = check.success ? 'RÉUSSI' : 'ÉCHEC';
    this.stampEl.innerHTML = `
      <div class="narrative-rollcard-inner">
        <div class="stamp ${verdictClass} narrative-rollcard-stamp">${verdictLabel}</div>
        <div class="narrative-rollcard-text">
          ${verdictText ? `<p class="narrative-rollcard-verdict">${verdictText}</p>` : ''}
          <p class="narrative-rollcard-detail">
            <span class="rollcard-dice">${dieChainText(check)}</span> · ${rollDetailText(check)}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Bloc du jet de reflexion d'un noeud `insight` (examen ecrit, ADR 0012 ;
   * facultatif avec cout, ADR 0015 §1) : question deja affichee par
   * `renderNarration`, ce bloc ajoute la puce (competence, DV, chance) + le
   * bouton de jet, avec juste a cote (meme bloc, pas au bas du panneau --
   * correctif de revue visuelle) le rappel "Réfléchissez d'abord..." tant
   * qu'aucun jet n'a ete tire ; une fois resolu, il s'efface -- le verdict vit
   * dans la carte de resultat (`renderRollCard`), pas ici (mise en scene
   * commune aux deux mecanismes de jet).
   *
   * Mandatory (`optional` absent) : bouton "Lancer le dé", reponses
   * verrouillees tant qu'il n'a pas ete clique (statut `pending`).
   * Facultatif (`optional: true`, ADR 0015 §1) : bouton "Réfléchir (N
   * concentration)", desactive si `affordable` est faux, reponses JAMAIS
   * verrouillees (statut `available`) -- le joueur peut repondre sans lancer
   * le de.
   *
   * Des qu'un jet a ete tire (`insight.roll` present), la mise en scene et le
   * verrouillage suivent le meme chemin que le cas mandatory resolu, MEME si
   * `status` reste `pending`/`available` -- c'est le cas d'un jet en attente
   * de Chance (ADR 0015 §2, `PresentedNode.pendingRoll`) : le de doit rejouer
   * l'echec avant que l'invite "dépenser N Chance ?" (`renderLuckPrompt`)
   * n'apparaisse.
   */
  private renderInsight(
    node: PresentedNode,
    token: number,
  ): { locked: boolean; reveal: { roll: PresentedRoll; text?: string } | null } {
    const insight = node.insight;
    if (!insight) {
      this.insightEl.hidden = true;
      return { locked: false, reveal: null };
    }

    if (!insight.roll && (insight.status === 'pending' || insight.status === 'available')) {
      const disabled = insight.optional === true && insight.affordable === false;
      const label = insight.optional ? `Réfléchir (${insight.cost?.amount ?? 1} concentration)` : 'Lancer le dé';
      const hint = insight.optional
        ? ''
        : `<span class="narrative-insight-hint">Réfléchissez d'abord : lancez le dé.</span>`;
      this.insightEl.hidden = false;
      this.insightEl.innerHTML = `
        <span class="chip-check">
          <span class="chip-check__skill">${insight.skillLabel}</span>
          <span class="chip-check__dv">DV ${dvName(insight.dvLabel)}</span>
          <span class="chip-check__pct">${insight.chancePercent}%</span>
        </span>
        <button type="button" class="btn btn--primary" data-testid="insight-roll" ${disabled ? 'disabled' : ''}>${label}</button>
        ${hint}
      `;
      const btn = this.insightEl.querySelector('[data-testid="insight-roll"]') as HTMLButtonElement;
      btn.addEventListener('click', () => this.callbacks.onRollInsight());
      if (!disabled && !insight.optional) btn.focus();
      // Facultatif : jamais verrouille, le joueur peut repondre sans lancer le de.
      return { locked: !insight.optional, reveal: null };
    }

    const roll = insight.roll ?? null;
    if (!roll) {
      // Donnee invalide (rollInsight a echoue silencieusement cote moteur,
      // voir dialogueRunner.ts) : rien a montrer, choix libres.
      this.insightEl.hidden = true;
      return { locked: false, reveal: null };
    }

    this.insightEl.hidden = true; // le verdict vit dans la carte de resultat une fois revele
    if (this.ensureRevealed(roll, token, node)) return { locked: true, reveal: null };

    const text = insight.status === 'success' ? insight.successText : insight.failureText;
    return { locked: false, reveal: { roll, text } };
  }

  /**
   * `locked` desactive chaque bouton de reponse (jet de reflexion en attente
   * ou en cours de mise en scene, ADR 0012) : un vrai `disabled`, pas
   * seulement visuel -- il bloque aussi bien le clic que le raccourci clavier
   * (`onKeyDown` appelle `btn.click()`, sans effet sur un bouton desactive) et
   * un `.click()` programmatique. Le joueur doit pouvoir LIRE les reponses
   * avant de lancer le de (revue visuelle) : un choix desactive saute son
   * animation d'entree (`--line-delay`) et s'affiche immediatement, texte
   * `--bone-dim` plutot qu'estompe -- jamais une opacite qui le rend
   * quasi invisible (voir `.narrative-choice:disabled` dans styles.css).
   * `revealBest` n'affiche la marque `best` (ADR 0012) qu'une fois le jet de
   * reflexion REVELE (jamais pendant qu'il patiente ou tourne encore) : le
   * moteur pose `choice.best` des la reussite du jet, avant toute mise en
   * scene -- c'est cette vue qui retient l'affichage jusqu'au bon moment.
   */
  private renderChoices(choices: PresentedChoice[], locked = false, revealBest = true): void {
    this.choicesEl.innerHTML = '';
    this.choicesEl.hidden = false;
    this.advanceEl.hidden = true;

    if (choices.length === 0) {
      // Noeud terminal ou enchainement automatique : "Continuer" seul, en bas a droite.
      this.choicesEl.hidden = true;
      this.advanceEl.hidden = false;
      this.advanceEl.textContent = 'Continuer';
      this.advanceEl.onclick = () => this.callbacks.onAdvance();
      return;
    }

    if (choices.length === 1 && !choices[0]?.check) {
      // Choix unique sans jet ("Continuer.", "Rejoindre le groupe."...) : meme
      // traitement qu'un simple Continuer, avec le vrai texte du choix.
      const only = choices[0] as PresentedChoice;
      this.choicesEl.hidden = true;
      this.advanceEl.hidden = false;
      this.advanceEl.textContent = stripCheckPrefix(only.text) || 'Continuer';
      this.advanceEl.onclick = () => this.callbacks.onChoose(only.index);
      return;
    }
    this.advanceEl.onclick = () => this.callbacks.onAdvance();

    // `choice.index` est la position du choix dans le graphe (voir dialogueRunner.ts) : un
    // choix cache par une condition fausse "saute" son numero. Les touches 1-9 et le badge
    // affiche doivent en revanche toujours correspondre a ce qui est REELLEMENT a l'ecran :
    // on numerote ici par position d'affichage, pas par `choice.index`.
    choices.forEach((choice, position) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'narrative-choice';
      btn.dataset.testid = `choice-${choice.index}`;
      // Desactive : lisible tout de suite, pas de decalage d'entree a attendre.
      if (!locked) btn.style.setProperty('--line-delay', `${position * 90}ms`);
      btn.disabled = locked;

      const number = document.createElement('span');
      number.className = 'choice-number';
      number.textContent = String(position + 1);
      const text = document.createElement('span');
      text.className = 'choice-text';
      text.textContent = stripCheckPrefix(choice.text);
      btn.append(number, text);

      // Le pilier "le dé raconte" : competence, DV et chance affichees, jamais
      // cachees derriere le texte du choix (voir docs/design/07-DIALOGUE-FORMAT.md).
      if (choice.check) {
        const chip = document.createElement('span');
        chip.className = 'chip-check';
        chip.innerHTML =
          `<span class="chip-check__skill">${choice.check.skillLabel}</span>` +
          `<span class="chip-check__dv">DV ${dvName(choice.check.dvLabel)}</span>` +
          `<span class="chip-check__pct">${choice.check.chancePercent}%</span>`;
        btn.appendChild(chip);
      }

      // Reponse attendue de l'institution (ADR 0012) : filet tape a gauche +
      // petite marque en casse normale ("Ce qu'on s'interdit" : les capitales
      // sont reservees aux tampons), jamais sur un echec.
      if (revealBest && choice.best) {
        btn.classList.add('narrative-choice--best');
        const label = document.createElement('span');
        label.className = 'choice-best-label';
        label.textContent = 'Réponse attendue';
        btn.appendChild(label);
      }

      btn.addEventListener('click', () => this.callbacks.onChoose(choice.index));
      this.choicesEl.appendChild(btn);
    });
  }

  /**
   * Carte de titre plein ecran entre deux scenes (1,2s, passable au clic,
   * 600ms statique en mouvement reduit). Purement visuelle : ne bloque jamais
   * `window.__game`, qui pilote `ChapterApp`/`DialogueRunner` directement,
   * jamais via cette vue (voir docs/process/DEBUG_API.md).
   */
  private maybeShowSceneCard(sceneTitle: string, sceneId: string): void {
    if (!sceneId || sceneId === this.lastSceneId) return;
    this.lastSceneId = sceneId;

    const number = SCENE_NUMBERS[sceneId];
    const [room, name] = splitTitle(sceneTitle);
    this.sceneCardEl.innerHTML = `
      <div class="scene-card-inner">
        ${number ? `<p class="scene-card-count">Scène ${number} / ${TOTAL_SCENES}</p>` : ''}
        <h1 class="scene-card-title">${room ? `<span class="narrative-scene-room">${room}</span> — ${name}` : name}</h1>
        <div class="stamp scene-card-stamp">CHAPITRE 1</div>
      </div>
    `;
    this.sceneCardEl.hidden = false;

    window.clearTimeout(this.sceneCardTimer);
    this.sceneCardTimer = window.setTimeout(
      () => this.dismissSceneCard(),
      reducedMotion() ? SCENE_CARD_REDUCED_MS : SCENE_CARD_MS,
    );
  }

  private dismissSceneCard(): void {
    window.clearTimeout(this.sceneCardTimer);
    this.sceneCardEl.hidden = true;
    this.sceneCardEl.innerHTML = '';
  }

  /**
   * Repliques radio a afficher par-dessus la scene : encart cyan, portrait
   * radio, empilement (3 max, la plus ancienne cede la place), effacement
   * individuel apres 6s ou au clic (docs/art/UI-DESIGN-SYSTEM.md, "Dialogue").
   * Contrairement a la premiere passe, ne sont PAS effacees par le prochain
   * noeud : chaque replique vit son propre minuteur, independant du recit.
   */
  showRadio(cues: RadioCue[]): void {
    for (const cue of cues) {
      while (this.radioStackEl.children.length >= RADIO_MAX) {
        this.dismissRadioCue(this.radioStackEl.firstElementChild as HTMLElement | null);
      }
      const el = document.createElement('div');
      el.className = 'narrative-radio-cue panel';
      el.dataset.cueId = cue.id;
      el.appendChild(portraitElement('radio', 'thumb'));
      const body = document.createElement('div');
      body.className = 'narrative-radio-body';
      body.innerHTML = `<span class="radio-tag">Instructeur</span><p>${cue.text}</p>`;
      el.appendChild(body);
      el.addEventListener('click', () => this.dismissRadioCue(el));
      this.radioStackEl.appendChild(el);
      const timer = window.setTimeout(() => this.dismissRadioCue(el), RADIO_CUE_MS);
      this.radioTimers.set(el, timer);
    }
  }

  private dismissRadioCue(el: HTMLElement | null): void {
    if (!el) return;
    const timer = this.radioTimers.get(el);
    if (timer !== undefined) window.clearTimeout(timer);
    this.radioTimers.delete(el);
    el.remove();
  }

  private dismissAllRadio(): void {
    Array.from(this.radioStackEl.children).forEach((el) => this.dismissRadioCue(el as HTMLElement));
  }

  /**
   * Journal du parcours reellement joue par l'equipe adverse (recompense du
   * dilemme de la salle 3, defaut 1 du rapport de cloture epic 2) : encart
   * sobre en accent cyan, disparait au noeud suivant comme avant (voir
   * `ChapterApp.checkOffscreenReward`, appelee une seule fois).
   */
  showOffscreenLog(log: string[]): void {
    if (log.length === 0) return;
    this.offscreenEl.hidden = false;
    this.offscreenEl.innerHTML =
      '<span class="offscreen-tag">Vidéo de sécurité — équipe adverse</span>' +
      log.map((line) => `<p>${line}</p>`).join('');
  }

  show(): void {
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.clearTimeout(this.sceneCardTimer);
    this.radioTimers.forEach((t) => window.clearTimeout(t));
    this.root.remove();
  }

  /**
   * Navigation clavier : chiffres 1-9 pour choisir, Espace/Entree pour
   * continuer/valider, Echap ferme la radio. La carte de scene se ferme sur
   * n'importe quelle touche pendant qu'elle est visible. La carte de resultat
   * n'a plus de geste de fermeture dedie : elle est dans le flux normal du
   * panneau (voir `renderRollCard`) et disparait d'elle-meme au noeud suivant.
   */
  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.root.hidden) return;
    // Une mise en scene de de est en cours et pas encore revelee : le
    // panneau affiche encore le contenu PRECEDENT (voir `render`), aucune
    // touche ne doit agir dessus -- sauf le bouton "Lancer le dé" lui-meme,
    // qui gere son focus/Espace/Entree nativement (bouton HTML standard).
    if (this.animatingRoll && this.animatingRoll !== this.revealedRoll) return;

    if (e.key === 'Escape') {
      this.dismissAllRadio();
      return;
    }

    if (!this.sceneCardEl.hidden) {
      e.preventDefault();
      this.dismissSceneCard();
      return;
    }

    if (e.key >= '1' && e.key <= '9') {
      // Position d'affichage, pas `choice.index` : voir le commentaire de `renderChoices`.
      const btn = this.choicesEl.children[Number(e.key) - 1] as HTMLButtonElement | undefined;
      if (btn) {
        e.preventDefault();
        btn.click();
      }
      return;
    }

    if (e.key === ' ' || e.key === 'Enter') {
      const target = this.choicesEl.hidden ? this.advanceEl : null;
      if (target && !target.hidden) {
        e.preventDefault();
        target.click();
      }
    }
  };
}
