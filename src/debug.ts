const debugElement = document.createElement("div");
debugElement.id = "debug";
document.body.appendChild(debugElement);

export function updateDebug(message: string) {
  debugElement.innerText = message;
}
