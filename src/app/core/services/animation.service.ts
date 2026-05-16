import { Injectable } from '@angular/core';
import { animate, stagger } from 'animejs';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  pageEnter(target: HTMLElement): void {
    animate(target, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 650,
      ease: 'outCubic'
    });
  }

  cardsEnter(targets: NodeListOf<Element> | Element[]): void {
    animate(targets, {
      opacity: [0, 1],
      translateY: [24, 0],
      scale: [0.97, 1],
      duration: 650,
      delay: stagger(90),
      ease: 'outCubic'
    });
  }

  rowsEnter(targets: NodeListOf<Element> | Element[]): void {
    animate(targets, {
      opacity: [0, 1],
      translateX: [-12, 0],
      duration: 420,
      delay: stagger(45),
      ease: 'outCubic'
    });
  }

  pulse(target: HTMLElement): void {
    animate(target, {
      scale: [1, 1.035, 1],
      duration: 450,
      ease: 'outCubic'
    });
  }

  aiPanelEnter(target: HTMLElement): void {
    animate(target, {
      opacity: [0, 1],
      translateY: [16, 0],
      scale: [0.98, 1],
      duration: 520,
      ease: 'outCubic'
    });
  }
}
