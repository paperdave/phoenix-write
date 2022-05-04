const debugElement = document.querySelector("#debug") as HTMLDivElement;

export function updateDebug(message: string) {
  debugElement.innerText = message;
}
