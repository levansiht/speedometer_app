class SpeedFilter {
    private speedHistory: number[] = [];
    private readonly maxHistorySize: number = 5;
    private readonly threshold: number = 0.5;

    filter(rawSpeed: number | null, accuracy: number | null = null): number {
        const speed = Math.max(0, rawSpeed ?? 0);

        if (accuracy && accuracy > 20) {
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
