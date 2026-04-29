export function getRandom(min, max) {
  return min + Math.random() * (max + 1 - min);
}

export function getRandomInt(min, max) {
  let rand = getRandom(min, max);
  rand = Math.floor(rand);
  return rand;
}

export function getNameFileWithoutExtension(/* fileName */) {}

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}