import * as Speech from 'expo-speech';
import { convertSpeed } from '../constants/Units';
import { SpeedUnit } from '../types';

export interface VoiceConfig {
  enabled: boolean;
  language: string;
  pitch: number;
  rate: number;
  intervalKm: number;
}

export interface AnnouncementData {
  distanceKm: number;
  durationSeconds: number;
  averageSpeedMS: number;
  currentSpeedMS: number;
}

class VoiceServiceClass {
  private config: VoiceConfig = {
    enabled: true,
    language: 'vi-VN',
    pitch: 1.0,
    rate: 0.9,
    intervalKm: 1,
  };

  private lastAnnouncedKm: number = 0;
  private isSpeaking: boolean = false;

  updateConfig(newConfig: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  async announceDistance(data: AnnouncementData): Promise<void> {
    if (!this.config.enabled || this.isSpeaking) return;

    const currentKm = Math.floor(data.distanceKm);
    const shouldAnnounce = currentKm > 0 && currentKm % this.config.intervalKm === 0;

    if (shouldAnnounce && currentKm > this.lastAnnouncedKm) {
      this.lastAnnouncedKm = currentKm;

      const speedKmh = convertSpeed(data.averageSpeedMS, SpeedUnit.KMH);
      const hours = Math.floor(data.durationSeconds / 3600);
      const minutes = Math.floor((data.durationSeconds % 3600) / 60);

      let message = `Bạn đã đi được ${currentKm} kilômét. `;

      if (hours > 0) {
        message += `Thời gian: ${hours} giờ ${minutes} phút. `;
      } else {
        message += `Thời gian: ${minutes} phút. `;
      }

      message += `Tốc độ trung bình: ${speedKmh.toFixed(0)} kilômét mỗi giờ.`;

      await this.speak(message);
    }
  }

  async announceSpeedLimit(limitKmh: number, currentKmh: number): Promise<void> {
    if (!this.config.enabled || this.isSpeaking) return;

    const message = `Cảnh báo! Tốc độ hiện tại ${currentKmh.toFixed(
      0
    )} vượt quá giới hạn ${limitKmh} kilômét mỗi giờ.`;
    await this.speak(message);
  }

  async announceTripStart(): Promise<void> {
    if (!this.config.enabled) return;
    await this.speak('Bắt đầu hành trình. Chúc bạn đi đường an toàn!');
  }

  async announceTripPause(): Promise<void> {
    if (!this.config.enabled) return;
    await this.speak('Đã tạm dừng hành trình.');
  }

  async announceTripResume(): Promise<void> {
    if (!this.config.enabled) return;
    await this.speak('Tiếp tục hành trình.');
  }

  async announceTripEnd(data: AnnouncementData): Promise<void> {
    if (!this.config.enabled) return;

    const speedKmh = convertSpeed(data.averageSpeedMS, SpeedUnit.KMH);
    const hours = Math.floor(data.durationSeconds / 3600);
    const minutes = Math.floor((data.durationSeconds % 3600) / 60);

    let message = `Kết thúc hành trình. `;
    message += `Tổng quãng đường: ${data.distanceKm.toFixed(1)} kilômét. `;

    if (hours > 0) {
      message += `Thời gian: ${hours} giờ ${minutes} phút. `;
    } else {
      message += `Thời gian: ${minutes} phút. `;
    }

    message += `Tốc độ trung bình: ${speedKmh.toFixed(0)} kilômét mỗi giờ.`;

    await this.speak(message);
  }

  async speak(text: string): Promise<void> {
    if (this.isSpeaking) {
      this.stop();
    }

    this.isSpeaking = true;

    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const hasVietnamese = voices.some((v) => v.language.startsWith('vi'));

      await Speech.speak(text, {
        language: hasVietnamese ? this.config.language : 'en-US',
        pitch: this.config.pitch,
        rate: this.config.rate,
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: (error) => {
          console.error('Voice error:', error);
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      console.error('Voice announcement error:', error);
      this.isSpeaking = false;
    }
  }

  stop(): void {
    if (this.isSpeaking) {
      Speech.stop();
      this.isSpeaking = false;
    }
  }

  resetAnnouncementCounter(): void {
    this.lastAnnouncedKm = 0;
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.length > 0;
    } catch (error) {
      console.error('Voice check error:', error);
      return false;
    }
  }
}

export const VoiceService = new VoiceServiceClass();
