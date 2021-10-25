import EventEmitter from 'eventemitter3';

export const shakeeventemitter = new EventEmitter();

export function setScreenshake() {
	shakeeventemitter.emit('shake');
}
export function setScreenshake2() {
	shakeeventemitter.emit('shake2');
}
export function setScreenshakeVariable(v: number) {
	shakeeventemitter.emit('shake3', v);
}
