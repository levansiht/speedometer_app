import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Trip } from '../types';

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }
  generateGPX(trip: Trip): string {
    const startDate = new Date(trip.stats.startTime);
    const tripName = `Trip ${startDate.toLocaleDateString('vi-VN')}`;

    const formatDate = (timestamp: number) => new Date(timestamp).toISOString();

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" 
     creator="Speedometer App - https://github.com/levansiht/speedometer_app"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${tripName}</name>
    <desc>Distance: ${(trip.stats.distance / 1000).toFixed(2)} km, Duration: ${this.formatDuration(
      trip.stats.duration
    )}</desc>
    <time>${formatDate(trip.stats.startTime)}</time>
  </metadata>
  <trk>
    <name>${tripName}</name>
    <desc>Average Speed: ${(trip.stats.averageSpeed * 3.6).toFixed(2)} km/h, Max Speed: ${(
      trip.stats.maxSpeed * 3.6
    ).toFixed(2)} km/h</desc>
    <trkseg>
`;

    // Add track points
    for (const point of trip.route) {
      gpx += `      <trkpt lat="${point.latitude.toFixed(6)}" lon="${point.longitude.toFixed(6)}">
`;

      // Add elevation if available
      if (point.altitude !== undefined && point.altitude !== null) {
        gpx += `        <ele>${point.altitude.toFixed(2)}</ele>
`;
      }

      gpx += `        <time>${formatDate(point.timestamp)}</time>
`;

      if (point.speed !== undefined) {
        gpx += `        <extensions>
          <speed>${point.speed.toFixed(2)}</speed>
        </extensions>
`;
      }

      gpx += `      </trkpt>
`;
    }

    gpx += `    </trkseg>
  </trk>
</gpx>`;

    return gpx;
  }

  generateJSON(trip: Trip): string {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      trip: {
        id: trip.id,
        startTime: trip.stats.startTime,
        endTime: trip.stats.endTime,
        status: trip.status,
        statistics: {
          distance: trip.stats.distance,
          duration: trip.stats.duration,
          averageSpeed: trip.stats.averageSpeed,
          maxSpeed: trip.stats.maxSpeed,
          routePointsCount: trip.route.length,
        },
        route: trip.route.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          altitude: point.altitude,
          speed: point.speed,
          timestamp: point.timestamp,
        })),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  async saveToFile(filename: string, content: string): Promise<string> {
    try {
      const file = new File(Paths.cache, filename);

      // Delete file if it already exists
      if (file.exists) {
        await file.delete();
      }

      // Create new file and write content
      await file.create();
      await file.write(content);
      console.log('File saved to:', file.uri);
      return file.uri;
    } catch (error) {
      console.error('Failed to save file:', error);
      throw new Error('Không thể lưu file. Vui lòng thử lại.');
    }
  }

  async shareFile(fileUri: string, mimeType: string = 'application/octet-stream'): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Tính năng chia sẻ không khả dụng trên thiết bị này.');
      }

      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: 'Chia sẻ chuyến đi',
        UTI: mimeType,
      });

      console.log('File shared successfully');
    } catch (error) {
      console.error('Failed to share file:', error);
      throw new Error('Không thể chia sẻ file. Vui lòng thử lại.');
    }
  }

  async exportAndShareGPX(trip: Trip): Promise<void> {
    try {
      const gpxContent = this.generateGPX(trip);
      const startDate = new Date(trip.stats.startTime);
      const filename = `trip_${startDate.toISOString().split('T')[0]}_${trip.id.slice(0, 8)}.gpx`;

      const fileUri = await this.saveToFile(filename, gpxContent);
      await this.shareFile(fileUri, 'application/gpx+xml');
    } catch (error) {
      console.error('Failed to export GPX:', error);
      throw error;
    }
  }

  async exportAndShareJSON(trip: Trip): Promise<void> {
    try {
      const jsonContent = this.generateJSON(trip);
      const startDate = new Date(trip.stats.startTime);
      const filename = `trip_${startDate.toISOString().split('T')[0]}_${trip.id.slice(0, 8)}.json`;

      const fileUri = await this.saveToFile(filename, jsonContent);
      await this.shareFile(fileUri, 'application/json');
    } catch (error) {
      console.error('Failed to export JSON:', error);
      throw error;
    }
  }

  generateTextSummary(trip: Trip): string {
    const startDate = new Date(trip.stats.startTime);
    const distance = (trip.stats.distance / 1000).toFixed(2);
    const duration = this.formatDuration(trip.stats.duration);
    const avgSpeed = (trip.stats.averageSpeed * 3.6).toFixed(1);
    const maxSpeed = (trip.stats.maxSpeed * 3.6).toFixed(1);

    return `🚗 Chuyến đi ${startDate.toLocaleDateString('vi-VN')}

📏 Quãng đường: ${distance} km
⏱️ Thời gian: ${duration}
🚀 Tốc độ TB: ${avgSpeed} km/h
⚡ Tốc độ Max: ${maxSpeed} km/h
📍 Điểm GPS: ${trip.route.length}

Được ghi lại bởi Speedometer App`;
  }

  async shareTextSummary(trip: Trip): Promise<void> {
    try {
      const summary = this.generateTextSummary(trip);
      const filename = `trip_summary_${trip.id.slice(0, 8)}.txt`;

      const fileUri = await this.saveToFile(filename, summary);
      await this.shareFile(fileUri, 'text/plain');
    } catch (error) {
      console.error('Failed to share text summary:', error);
      throw error;
    }
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  async getFileInfo(fileUri: string): Promise<any> {
    const file = new File(fileUri);
    return { exists: file.exists, size: file.size };
  }

  async deleteFile(fileUri: string): Promise<void> {
    try {
      const file = new File(fileUri);
      await file.delete();
      console.log('File deleted:', fileUri);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }
}

export const exportService = ExportService.getInstance();
