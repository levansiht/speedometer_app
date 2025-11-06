class SpeedFilter {
  private speedHistory: number[] = [];
  private readonly maxHistorySize: number = 3; // Giảm từ 5 → 3 để responsive hơn
  private readonly threshold: number = 0.3; // Giảm từ 0.5 → 0.3 m/s (~1 km/h)

  filter(rawSpeed: number | null, accuracy: number | null = null): number {
    const speed = Math.max(0, rawSpeed ?? 0);

    // Nếu accuracy quá thấp (>30m), chỉ dùng speed cũ
    if (accuracy && accuracy > 30) {
      return this.getSmoothedSpeed();
    }

    this.speedHistory.push(speed);

    if (this.speedHistory.length > this.maxHistorySize) {
      this.speedHistory.shift();
    }

    return this.getSmoothedSpeed();
  }

  private getSmoothedSpeed(): number {
    if (this.speedHistory.length === 0) {
      return 0;
    }

    const sum = this.speedHistory.reduce((a, b) => a + b, 0);
    let avgSpeed = sum / this.speedHistory.length;

    if (avgSpeed < this.threshold) {
      avgSpeed = 0;
    }

    return avgSpeed;
  }

  reset(): void {
    this.speedHistory = [];
  }

  getCurrentSpeed(): number {
    return this.getSmoothedSpeed();
  }
}

export const speedFilter = new SpeedFilter();
