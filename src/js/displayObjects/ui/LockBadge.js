import { PIXI } from "PlayableAdsEngine";

// Иконка-замок для маркировки заблокированных тарелок и топпингов до
// апгрейда. Чисто Graphics — без ассетов. Жёлтый круг + силуэт замка.
// Используется как PIXI.Container, добавляется child'ом к view цели.
export default function createLockBadge(size = 36) {
  const c = new PIXI.Container();

  // Внешний круг (тёмно-золотой ободок)
  const ring = new PIXI.Graphics();
  ring.beginFill(0xc97a18);
  ring.drawCircle(0, 0, size / 2);
  ring.endFill();
  // Внутренний круг (жёлтый фон)
  ring.beginFill(0xffd750);
  ring.drawCircle(0, 0, size / 2 - 3);
  ring.endFill();
  c.addChild(ring);

  // Силуэт замка
  const lockColor = 0x4a3a20;
  const bodyW = size * 0.42;
  const bodyH = size * 0.32;
  const archR = size * 0.18;

  const lock = new PIXI.Graphics();
  // Дужка (не закрашенная — рисуем толстой линией)
  lock.lineStyle(3, lockColor, 1);
  lock.arc(0, -bodyH / 2, archR, Math.PI, 0, false);
  // Тело замка
  lock.lineStyle(0);
  lock.beginFill(lockColor);
  lock.drawRoundedRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, 2);
  lock.endFill();
  // Точка в центре (имитация замочной скважины)
  lock.beginFill(0xffd750);
  lock.drawCircle(0, 0, 1.5);
  lock.endFill();

  c.addChild(lock);
  return c;
}
