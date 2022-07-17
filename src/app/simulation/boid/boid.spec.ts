import { Boid } from './boid';

describe('Boid', () => {
  it('should create an instance', () => {
    expect(new Boid('Udofalcon', [])).toBeTruthy();
  });
});
