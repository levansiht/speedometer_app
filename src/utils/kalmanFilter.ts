export class KalmanFilter {
  private x: number = 0;
  private P: number = 1;
  private Q: number = 0.01;
  private R: number = 0.25;

  filter(measurement: number): number {
    const x_pred = this.x;
    const P_pred = this.P + this.Q;

    const K = P_pred / (P_pred + this.R);
    this.x = x_pred + K * (measurement - x_pred);
    this.P = (1 - K) * P_pred;

    return this.x;
  }

  getValue(): number {
    return this.x;
  }

  reset(): void {
    this.x = 0;
    this.P = 1;
  }

  setProcessNoise(q: number): void {
    this.Q = q;
  }

  setMeasurementNoise(r: number): void {
    this.R = r;
  }
}

