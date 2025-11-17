export class EMAFilter {
  private value: number = 0;
  private readonly alpha: number;

  constructor(alpha: number = 0.4) {
    this.alpha = Math.max(0.1, Math.min(0.9, alpha));
  }

  filter(newValue: number): number {
    if (this.value === 0) {
      this.value = newValue;
    } else {
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  getValue(): number {
    return this.value;
  }

  reset(): void {
    this.value = 0;
  }

  getAlpha(): number {
    return this.alpha;
  }
}

