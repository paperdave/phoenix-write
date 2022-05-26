import { Immutable } from '@davecode/types';
import { ComponentData } from '../types/level';

export interface KeyRequest {
  key: string;
  time: number;
}

export interface KeyPress {
  key: string;
  time: number;
}

export interface KeyPressEvent {
  key: string;
  time: number;
  expectedTime: number;
  offset: number;
}

export abstract class ComponentLogic<T = unknown> {
  data: Immutable<T>;

  constructor(data: Immutable<ComponentData<T>>) {
    this.data = data.data as Immutable<T>;
    this.init();
  }

  init(): void {}
  dispose(): void {}

  abstract getNextKey(): KeyRequest | null;
  abstract acceptKey(key: KeyPressEvent): void;
}
