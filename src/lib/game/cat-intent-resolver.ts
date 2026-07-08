import type { Cat, CatIntent } from './types';
import { applyMoodEvent } from './mood-system';

export function resolveIntents(intents: CatIntent[], allCats: readonly Cat[]): void {
  if (intents.length === 0) { return; }

  const catMap = new Map<string, Cat>(allCats.map(c => [c.id, c]));

  // Phase 1: Validation（基于原始状态，只读）
  const validIntents: CatIntent[] = [];

  for (const intent of intents) {
    switch (intent.type) {
      case 'want_chase':
      case 'want_play_fight':
      case 'want_reverse_chase': {
        const target = catMap.get(intent.targetId);
        if (target && canBeTarget(target)) {
          validIntents.push(intent);
        }
        break;
      }
      case 'want_stop_play_fighting':
        validIntents.push(intent);
        break;
    }
  }

  // Phase 2: Application（批量应用有效意图）
  const modified = new Set<string>();

  for (const intent of validIntents) {
    switch (intent.type) {
      case 'want_chase': {
        const target = catMap.get(intent.targetId)!;
        if (modified.has(target.id)) { break; }

        applyMoodEvent(target.mood, 'flee', target.personality, Date.now());
        target.action = 'fleeing';
        target.chaseTargetId = intent.initiatorId;
        target.actionTimer = 0;
        target.actionSwitchTimer = 0;
        modified.add(target.id);
        break;
      }
      case 'want_play_fight': {
        const initiator = catMap.get(intent.initiatorId)!;
        const target = catMap.get(intent.targetId)!;
        if (modified.has(target.id)) { break; }

        target.action = 'playFighting';
        target.actionTimer = 0;
        target.targetX = (initiator.x + target.x) / 2;
        target.targetY = (initiator.y + target.y) / 2;
        target.chaseTargetId = initiator.id;

        applyMoodEvent(target.mood, 'play_fight', target.personality, Date.now());
        modified.add(target.id);
        break;
      }
      case 'want_reverse_chase': {
        const target = catMap.get(intent.targetId)!;
        if (modified.has(target.id)) { break; }

        target.action = 'chasing';
        target.chaseTargetId = intent.initiatorId;
        target.actionTimer = 0;
        modified.add(target.id);
        break;
      }
      case 'want_stop_play_fighting': {
        const partner = allCats.find(c => c.chaseTargetId === intent.catId);
        if (partner && !modified.has(partner.id)) {
          partner.action = 'idle';
          partner.idleTimer = 30 + Math.floor(Math.random() * 60);
          partner.actionTimer = 0;
          partner.chaseTargetId = null;
          modified.add(partner.id);
        }
        break;
      }
    }
  }
}

function canBeTarget(cat: Cat): boolean {
  return cat.action !== 'sleeping'
    && cat.action !== 'hiding'
    && cat.action !== 'playFighting';
}
