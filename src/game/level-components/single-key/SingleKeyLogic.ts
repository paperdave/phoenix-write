import { SingleKeyData } from '.';
import { ComponentLogic, KeyPressEvent, KeyRequest } from '../../ComponentLogic';

export class SingleKeyLogic extends ComponentLogic<SingleKeyData> {
  keyIndex = 0;

  getNextKey(): KeyRequest | null {
    if (this.keyIndex >= this.data.times.length) {
      return null;
    }

    return {
      key: this.data.key,
      time: this.data.times[this.keyIndex],
    };
  }

  acceptKey(key: KeyPressEvent): void {
    this.keyIndex++;
    // Maybe we handle scoring inside our component, maybe not.
    console.log(key.time, key.expectedTime, key.offset);
  }
}
