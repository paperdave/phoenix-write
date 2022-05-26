import { Immutable } from '@davecode/types';
import { ComponentLogic, KeyPress, KeyPressEvent } from './ComponentLogic';
import { levelComponentRegistry } from './level-components';
import { ComponentData, LevelData } from '../types/level';

interface RuntimeComponent {
  type: string;
  name?: string;
  source: Immutable<ComponentData>;
  logic: ComponentLogic;
}

interface KeyRequest {
  press: KeyPress;
  on: RuntimeComponent;
}

const DELAY_TARGET_EARLY = -0.5;
const DELAY_TARGET_LATE = 0.5;
const DELAY_STRAY_KEY = 0.1;

export class CapslawGame {
  #root: HTMLElement;
  #time = -1;
  #components: RuntimeComponent[] = [];
  #keys: KeyPress[] = [];
  gameOver = false;

  constructor(readonly level: Immutable<LevelData>, container: HTMLElement) {
    this.#root = document.createElement('capslaw');
    this.#components = level.components.map(item => {
      const def = levelComponentRegistry[item.type];
      if (!def) {
        throw new Error(`Unknown component type: ${item.type}`);
      }

      const logic: ComponentLogic = new def.logic(item);
      return {
        type: item.type,
        name: item.name,
        source: item,
        logic,
      };
    });
    container.appendChild(this.#root);
    this.time = 0;
  }

  debug() {
    this.#root.innerHTML =
      '<br><br><br>' +
      `<div>
        game time = ${this.#time} <br>
      </div><br>` +
      this.#components
        .map((item, i) => {
          return `<div>
          <div>${item.name}, i=${i}, t=${item.type}</div>
          <div>${JSON.stringify(item.logic.data)}</div>
          <div>${JSON.stringify(item.logic.getNextKey())}</div>
          <hr>
        </div>`;
        })
        .join('\n');
  }

  pushKey(key: KeyPress) {
    this.#keys.push(key);
    this.processKeyQueue();
  }

  private processKeyQueue() {
    if (this.gameOver) return;

    while (true) {
      const requested = this.#components
        .map(item => ({
          on: item,
          press: item.logic.getNextKey(),
        }))
        .filter(x => x.press) as KeyRequest[];

      if (requested.length === 0) {
        break;
      }

      const found = this.#keys.findIndex(key => requested.some(req => req.press.key === key.key));
      if (found === -1) {
        break;
      }

      const keyToApply = this.#keys[found];
      this.#keys.splice(found, 1);

      requested
        .filter(
          req =>
            req.press.key === keyToApply.key &&
            req.press.time + DELAY_TARGET_EARLY <= keyToApply.time &&
            req.press.time + DELAY_TARGET_LATE >= keyToApply.time
        )
        .forEach(req => {
          const ev: KeyPressEvent = {
            key: keyToApply.key,
            time: keyToApply.time,
            expectedTime: req.press.time,
            offset: keyToApply.time - req.press.time,
          };
          console.log(`hit target ${ev.offset >= 0 ? '+' : ''}${Math.round(ev.offset * 1000)}ms`);
          req.on.logic.acceptKey(ev);
        });
    }

    const strayKeys = this.#keys.filter(key => {
      return key.time + DELAY_STRAY_KEY < this.#time;
    });

    if (strayKeys.length > 0) {
      console.log(`got stray key: ${strayKeys.map(x => x.key).join('')}`);
      console.log('Game Over');
      this.gameOver = true;
    }
    this.debug();
  }

  get time() {
    return this.#time;
  }

  set time(time: number) {
    if (this.gameOver) return;

    this.#time = time;
    this.processKeyQueue();
    this.debug();
  }
}
