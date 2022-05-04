import { Immutable } from "../typings/immutable";
import { ComponentData, LevelData } from "../typings/level";
import { LevelComponent } from "./level-components/base-component";
import { SingleKey } from "./level-components/single-key";

export class Game {
  #root: HTMLElement;
  #time = -1;

  #visibleStartIndex = 0;
  #visibleEndIndex = 0;
  #visibleComponentInstances: LevelComponent[] = [];

  #sortedComponentDataStart: Immutable<ComponentData>[];
  #sortedComponentDataEnd: Immutable<ComponentData>[];

  constructor(public level: Immutable<LevelData>, container: HTMLElement) {
    this.#root = document.createElement("capslaw");

    // Sorted component data used to make update calls way faster
    this.#sortedComponentDataStart = [...level.components].sort(
      (a, b) => a.time[0] - b.time[0]
    );
    this.#sortedComponentDataEnd = [...level.components].sort(
      (a, b) => a.time[1] - b.time[1]
    );

    this.#visibleEndIndex = this.#sortedComponentDataEnd.length;

    // Invoke Setter
    this.time = 0;

    container.appendChild(this.#root);
  }

  private createComponent(component: Immutable<ComponentData>) {
    const componentInstance = new SingleKey(component, this.#root);
    this.#visibleComponentInstances.push(componentInstance);
  }

  get time() {
    return this.#time;
  }

  set time(time: number) {
    // For moving time around, we need to update the game state by
    //  1. Clear all components that are no longer visible by checking start time
    //  2. Create all components that are now visible by checking end time
    //  3. Properly update .visibleStartIndex
    //  4. Trigger .update() on all components that are visible
    // Note that input handling is not done here, and the direction that time moves
    // impacts how this process is done.

    if (time > this.#time) {
      // 1. (a reverse for loop is used to avoid needing to modify `i`)
      for (let i = this.#visibleComponentInstances.length - 1; i >= 0; i--) {
        const component = this.#visibleComponentInstances[i];

        if (component.definition.time[1] < time) {
          component.dispose();
          component.root.remove();
          this.#visibleComponentInstances.splice(i, 1);
          this.#visibleEndIndex--;
        }
      }

      // 2. (done with a for loop to optimize performance)
      if (this.#visibleStartIndex >= 0) {
        for (
          let i = this.#visibleStartIndex;
          i < this.#sortedComponentDataStart.length;
          i++
        ) {
          if (this.#sortedComponentDataStart[i].time[0] <= time) {
            const component = this.#sortedComponentDataStart[i];

            // Only add components that have not already ended
            if (component.time[1] > time) {
              this.createComponent(component);
            } else {
              this.#visibleEndIndex--;
            }

            // 4. This is now the first component that will become visible
            this.#visibleStartIndex++;
          } else {
            // We can break here because the components are sorted by start time
            break;
          }
        }
      }
    } else {
      // 1. (a reverse for loop is used to avoid needing to modify `i`)
      for (let i = this.#visibleComponentInstances.length - 1; i >= 0; i--) {
        const component = this.#visibleComponentInstances[i];

        if (component.definition.time[0] > time) {
          component.dispose();
          component.root.remove();
          this.#visibleComponentInstances.splice(i, 1);

          // 3. Moving this index back one will place it at the right component, even though we
          // don't have that information in this context.
          this.#visibleStartIndex--;
        }
      }

      // 2. (done with a for loop to optimize performance)
      if (this.#visibleEndIndex < this.#sortedComponentDataEnd.length) {
        for (
          let i = this.#visibleEndIndex;
          i < this.#sortedComponentDataEnd.length;
          i++
        ) {
          if (this.#sortedComponentDataEnd[i].time[1] >= time) {
            const component = this.#sortedComponentDataEnd[i];

            // Only add components that have not already ended
            if (component.time[0] <= time) {
              this.createComponent(component);
            } else {
              this.#visibleStartIndex++;
            }

            // 4.
            this.#visibleEndIndex++;
          } else {
            // We can break here because the components are sorted by end time
            break;
          }
        }
      }
    }

    for (const component of this.#visibleComponentInstances) {
      component.update(time);
    }

    this.#time = time;
  }
}
