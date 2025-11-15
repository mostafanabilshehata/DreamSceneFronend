// import { AnimateOnScrollDirective } from './animate-on-scroll.directive';

// describe('AnimateOnScrollDirective', () => {
//   it('should create an instance', () => {
//     const directive = new AnimateOnScrollDirective();
//     expect(directive).toBeTruthy();
//   });
// });
import { AnimateOnScrollDirective } from './animate-on-scroll.directive';
import { ElementRef } from '@angular/core';

describe('AnimateOnScrollDirective', () => {
  it('should create an instance', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    const directive = new AnimateOnScrollDirective(mockElementRef);
    expect(directive).toBeTruthy();
  });
});
