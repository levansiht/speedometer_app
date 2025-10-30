import * as SQLite from 'expo-sqlite';
import type { Trip, RoutePoint } from '../types';

const DB_NAME = 'speedometer.db';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS trips (
                id TEXT PRIMARY KEY,
                start_time INTEGER NOT NULL,
                end_time INTEGER,
                status TEXT NOT NULL,
                distance REAL DEFAULT 0,
                duration INTEGER DEFAULT 0,
                average_speed REAL DEFAULT 0,
                max_speed REAL DEFAULT 0,
                route_points_count INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            );
        `);

    await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS route_points (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trip_id TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                speed REAL DEFAULT 0,
                accuracy REAL,
                altitude REAL,
                heading REAL,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
            );
        `);

    await this.db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips(start_time DESC);
            CREATE INDEX IF NOT EXISTS idx_route_points_trip_id ON route_points(trip_id);
            CREATE INDEX IF NOT EXISTS idx_route_points_timestamp ON route_points(timestamp);
        `);

    console.log('Database tables created successfully');
  }

  async saveTrip(trip: Trip): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const startTime = trip.stats.startTime ?? trip.createdAt;
      const endTime = trip.stats.endTime ?? Date.now();

      await this.db.runAsync(
        `INSERT OR REPLACE INTO trips 
                (id, start_time, end_time, status, distance, duration, average_speed, max_speed, route_points_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trip.id,
          startTime,
          endTime,
          trip.status,
          trip.stats.distance,
          trip.stats.duration,
          trip.stats.averageSpeed,
          trip.stats.maxSpeed,
          trip.route.length,
        ]
      );

      if (trip.route.length > 0) {
        const statement = await this.db.prepareAsync(
          `INSERT INTO route_points 
                    (trip_id, latitude, longitude, speed, accuracy, altitude, heading, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );

        try {
          for (const point of trip.route) {
            await statement.executeAsync([
              trip.id,
              point.latitude,
              point.longitude,
              point.speed,
              null,
              point.altitude ?? null,
              null,
              point.timestamp,
            ]);
          }
        } finally {
          await statement.finalizeAsync();
        }
      }

      console.log(`Trip ${trip.id} saved successfully with ${trip.route.length} points`);
    } catch (error) {
      console.error('Failed to save trip:', error);
      throw error;
    }
  }

  async getAllTrips(): Promise<Trip[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync<{
        id: string;
        start_time: number;
        end_time: number | null;
        status: string;
        distance: number;
        duration: number;
        average_speed: number;
        max_speed: number;
        route_points_count: number;
      }>('SELECT * FROM trips ORDER BY start_time DESC');

      const trips: Trip[] = [];

      for (const row of result) {
        const routePoints = await this.getRoutePoints(row.id);

        trips.push({
          id: row.id,
          status: row.status as Trip['status'],
          route: routePoints,
          stats: {
            distance: row.distance,
            duration: row.duration,
            averageSpeed: row.average_speed,
            maxSpeed: row.max_speed,
            startTime: row.start_time,
            endTime: row.end_time,
          },
          createdAt: row.start_time,
          updatedAt: row.end_time ?? row.start_time,
        });
      }

      return trips;
    } catch (error) {
      console.error('Failed to get all trips:', error);
      throw error;
    }
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<{
        id: string;
        start_time: number;
        end_time: number | null;
        status: string;
        distance: number;
        duration: number;
        average_speed: number;
        max_speed: number;
      }>('SELECT * FROM trips WHERE id = ?', [tripId]);

      if (!result) return null;

      const routePoints = await this.getRoutePoints(tripId);

      return {
        id: result.id,
        status: result.status as Trip['status'],
        route: routePoints,
        stats: {
          distance: result.distance,
          duration: result.duration,
          averageSpeed: result.average_speed,
          maxSpeed: result.max_speed,
          startTime: result.start_time,
          endTime: result.end_time,
        },
        createdAt: result.start_time,
        updatedAt: result.end_time ?? result.start_time,
      };
    } catch (error) {
      console.error('Failed to get trip by ID:', error);
      throw error;
    }
  }

  private async getRoutePoints(tripId: string): Promise<RoutePoint[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<{
      latitude: number;
      longitude: number;
      speed: number;
      accuracy: number | null;
      altitude: number | null;
      heading: number | null;
      timestamp: number;
    }>('SELECT * FROM route_points WHERE trip_id = ? ORDER BY timestamp ASC', [tripId]);

    return result.map((row) => ({
      latitude: row.latitude,
      longitude: row.longitude,
      speed: row.speed,
      altitude: row.altitude ?? undefined,
      timestamp: row.timestamp,
    }));
  }

  async deleteTrip(tripId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM trips WHERE id = ?', [tripId]);
      console.log(`Trip ${tripId} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete trip:', error);
      throw error;
    }
  }

  async deleteAllTrips(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM trips');
      await this.db.runAsync('DELETE FROM route_points');
      console.log('All trips deleted successfully');
    } catch (error) {
      console.error('Failed to delete all trips:', error);
      throw error;
    }
  }

  async getTripCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM trips'
    );

    return result?.count ?? 0;
  }

  async getStats(): Promise<{
    totalTrips: number;
    totalDistance: number;
    totalDuration: number;
    totalRoutePoints: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{
      total_trips: number;
      total_distance: number;
      total_duration: number;
      total_route_points: number;
    }>(`
            SELECT 
                COUNT(*) as total_trips,
                COALESCE(SUM(distance), 0) as total_distance,
                COALESCE(SUM(duration), 0) as total_duration,
                (SELECT COUNT(*) FROM route_points) as total_route_points
            FROM trips
        `);

    return {
      totalTrips: result?.total_trips ?? 0,
      totalDistance: result?.total_distance ?? 0,
      totalDuration: result?.total_duration ?? 0,
      totalRoutePoints: result?.total_route_points ?? 0,
    };
  }

  // Debug function to view all database data
  async debugDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Get all trips
      const trips = await this.db.getAllAsync<any>('SELECT * FROM trips ORDER BY start_time DESC');
      console.log('=== DATABASE DEBUG ===');
      console.log(`Total trips: ${trips.length}`);
      console.log('Trips:', JSON.stringify(trips, null, 2));

      // Get all route points
      const routePoints = await this.db.getAllAsync<any>(
        'SELECT * FROM route_points ORDER BY trip_id, timestamp'
      );
      console.log(`Total route points: ${routePoints.length}`);
      console.log(
        'Route points sample (first 5):',
        JSON.stringify(routePoints.slice(0, 5), null, 2)
      );

      // Get stats
      const stats = await this.getStats();
      console.log('Database stats:', JSON.stringify(stats, null, 2));
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Debug database error:', error);
    }
  }

  // Get database file path for external viewing
  async getDatabasePath(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    // For expo-sqlite, the database is stored in the app's documents directory
    // The exact path depends on the platform
    const path = `${DB_NAME} is stored in app documents directory`;
    console.log('Database location:', path);
    return path;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('Database closed');
    }
  }
}

export const db = DatabaseService.getInstance();
