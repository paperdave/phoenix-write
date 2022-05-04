import { Immutable } from "../typings/immutable";
import { ComponentData } from "../typings/level";
import { LevelComponent } from "./level-components/base-component";
import { SingleKey } from "./level-components/single-key";

export class OnScreenComponentManager {
  #disposed = false;

  #root: HTMLElement;

  #time = 0;

  #startPointer = 0;
  #endPointer = 0;

  #activeInstances: LevelComponent[] = [];

  // Sorted component data used to make update calls way faster
  #sortedStart: Immutable<ComponentData>[] = [];
  #sortedEnd: Immutable<ComponentData>[] = [];

  constructor(components: Immutable<ComponentData[]>, container: HTMLElement) {
    this.#root = document.createElement("component-manager");
    container.appendChild(this.#root);
    this.components = components;
  }

  private createComponent(component: Immutable<ComponentData>) {
    const componentInstance = new SingleKey(component, this.#root);
    this.#activeInstances.push(componentInstance);
  }

  get components() {
    return this.#sortedStart;
  }

  set components(components: Immutable<ComponentData[]>) {
    if (this.#disposed) return;

    for (const component of this.#activeInstances) {
      component.dispose();
      component.root.remove();
    }

    this.#activeInstances = [];

    this.#sortedStart = [...components].sort(
      (a, b) => a.time.start - b.time.start
    );
    this.#sortedEnd = [...components].sort((a, b) => a.time.end - b.time.end);

    this.#endPointer = this.#sortedEnd.length;

    const oldTime = this.#time;
    this.#time = -1;
    this.time = oldTime;
  }

  get time() {
    return this.#time;
  }

  set time(time: number) {
    if (this.#disposed) return;

    // For moving time around, we need to update the game state by
    //  1. Clear all components that are no longer visible by checking start time
    //  2. Create all components that are now visible by checking end time
    //  3. Properly update .visibleStartIndex
    //  4. Trigger .update() on all components that are visible
    // Note that input handling is not done here, and the direction that time moves
    // impacts how this process is done.

    if (time > this.#time) {
      // 1. (a reverse for loop is used to avoid needing to modify `i`)
      for (let i = this.#activeInstances.length - 1; i >= 0; i--) {
        const component = this.#activeInstances[i];

        if (component.definition.time.end < time) {
          component.dispose();
          component.root.remove();
          this.#activeInstances.splice(i, 1);
          this.#endPointer--;
        }
      }

      // 2. (done with a for loop to optimize performance)
      if (this.#startPointer >= 0) {
        for (let i = this.#startPointer; i < this.#sortedStart.length; i++) {
          if (this.#sortedStart[i].time.start <= time) {
            const component = this.#sortedStart[i];

            // Only add components that have not already ended
            if (component.time.end > time) {
              this.createComponent(component);
            } else {
              this.#endPointer--;
            }

            // 4. This is now the first component that will become visible
            this.#startPointer++;
          } else {
            // We can break here because the components are sorted by start time
            break;
          }
        }
      }
    } else {
      // 1. (a reverse for loop is used to avoid needing to modify `i`)
      for (let i = this.#activeInstances.length - 1; i >= 0; i--) {
        const component = this.#activeInstances[i];

        if (component.definition.time.start > time) {
          component.dispose();
          component.root.remove();
          this.#activeInstances.splice(i, 1);

          // 3. Moving this index back one will place it at the right component, even though we
          // don't have that information in this context.
          this.#startPointer--;
        }
      }

      // 2. (done with a for loop to optimize performance)
      if (this.#endPointer < this.#sortedEnd.length) {
        for (let i = this.#endPointer; i < this.#sortedEnd.length; i++) {
          if (this.#sortedEnd[i].time.end >= time) {
            const component = this.#sortedEnd[i];

            // Only add components that have not already ended
            if (component.time.start <= time) {
              this.createComponent(component);
            } else {
              this.#startPointer++;
            }

            // 4.
            this.#endPointer++;
          } else {
            // We can break here because the components are sorted by end time
            break;
          }
        }
      }
    }

    for (const component of this.#activeInstances) {
      component.update(time);
    }

    this.#time = time;
  }

  get disposed() {
    return this.#disposed;
  }

  dispose() {
    this.#disposed = true;
    for (const component of this.#activeInstances) {
      component.dispose();
      component.root.remove();
    }
    this.#activeInstances = [];
    this.#root.remove();
  }
}
