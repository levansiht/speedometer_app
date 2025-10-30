# Hướng Dẫn Xem Database SQLite

## Database Info

- **Tên file**: `speedometer.db`
- **Database Engine**: SQLite 3
- **Location**: App's documents directory

## Cách 1: Sử Dụng Debug Button (Dễ Nhất) ⭐

1. Mở app và vào màn hình **Lịch sử** (History)
2. Nhấn nút **🔍 Debug DB** ở góc trên bên phải
3. Mở **Metro console** hoặc **Terminal** để xem output
4. Bạn sẽ thấy:
   - Tất cả trips với chi tiết
   - Route points (5 điểm đầu tiên)
   - Database statistics

```bash
# Output mẫu:
=== DATABASE DEBUG ===
Total trips: 3
Trips: [
  {
    "id": "trip_123",
    "start_time": 1698670800000,
    "distance": 5420.5,
    ...
  }
]
Total route points: 1250
Route points sample (first 5): [...]
Database stats: {
  "totalTrips": 3,
  "totalDistance": 15230.5,
  "totalDuration": 3600
}
=== END DEBUG ===
```

## Cách 2: Sử Dụng Console Logs

Database tự động log các operations:

```bash
# Xem logs khi:
- Initialize database: "Database initialized successfully"
- Save trip: "Saved trip to database: trip_xxx"
- Load trips: "Loaded X trips from database"
- Delete trip: "Deleted trip xxx from database"
```

## Cách 3: Truy Cập File Database Trực Tiếp

### Trên iOS Simulator:

```bash
# Tìm database file
find ~/Library/Developer/CoreSimulator/Devices -name speedometer.db

# Hoặc
xcrun simctl get_app_container booted com.levansiht.speedometerapp data
# Sau đó vào thư mục Documents/SQLite/speedometer.db
```

### Trên Android Emulator:

```bash
# Vào device shell
adb shell

# Navigate to app data
cd /data/data/com.levansiht.speedometerapp/databases/
ls -la

# Copy file ra máy
adb pull /data/data/com.levansiht.speedometerapp/databases/speedometer.db ~/Desktop/
```

## Cách 4: Sử Dụng Database Tools

Sau khi có file `speedometer.db`, mở bằng:

### 1. **DB Browser for SQLite** (Miễn phí, Khuyên dùng)

- Download: https://sqlitebrowser.org/
- Mở file → Browse Data → Xem tables (trips, route_points)
- Execute SQL queries

### 2. **TablePlus** (macOS, Đẹp)

- Download: https://tableplus.com/
- Support SQLite, GUI đẹp

### 3. **VS Code Extension**

- Extension: "SQLite Viewer" hoặc "SQLite"
- Mở file .db trực tiếp trong VS Code

### 4. **Command Line**

```bash
sqlite3 speedometer.db

# SQLite commands:
.tables                    # List all tables
.schema trips             # Show table structure
SELECT * FROM trips;      # Query data
SELECT COUNT(*) FROM route_points;
.exit                     # Exit
```

## Database Schema

### Table: `trips`

```sql
CREATE TABLE trips (
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
```

### Table: `route_points`

```sql
CREATE TABLE route_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    speed REAL DEFAULT 0,
    altitude REAL,
    accuracy REAL,
    heading REAL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);
```

## Queries Hữu Ích

```sql
-- Xem tất cả trips
SELECT * FROM trips ORDER BY start_time DESC;

-- Đếm route points cho mỗi trip
SELECT trip_id, COUNT(*) as points
FROM route_points
GROUP BY trip_id;

-- Trip dài nhất
SELECT * FROM trips
ORDER BY distance DESC
LIMIT 1;

-- Trip nhanh nhất
SELECT * FROM trips
ORDER BY max_speed DESC
LIMIT 1;

-- Route points của một trip
SELECT * FROM route_points
WHERE trip_id = 'your_trip_id'
ORDER BY timestamp;

-- Statistics
SELECT
    COUNT(*) as total_trips,
    SUM(distance) as total_distance,
    SUM(duration) as total_duration,
    AVG(average_speed) as avg_speed,
    MAX(max_speed) as max_speed
FROM trips;
```

## Troubleshooting

### Database not found?

- App chưa chạy lần đầu
- Database chưa được initialize
- Check console logs: "Database initialized successfully"

### Empty database?

- Chưa có trip nào được lưu
- Check: Start trip → Stop trip → Xem lại

### Permission denied (Android)?

```bash
# Root device hoặc dùng emulator
adb root
adb shell
```

## Tips

1. **Development**: Dùng Debug button để kiểm tra nhanh
2. **Detailed Analysis**: Export database file và dùng DB Browser
3. **Performance**: Check indexes với `.indexes` trong sqlite3
4. **Backup**: Copy file database ra ngoài trước khi test xóa

## Remove Debug Button (Production)

Khi deploy, xóa debug button trong `TripHistoryScreen.tsx`:

```tsx
// Comment out hoặc xóa:
<TouchableOpacity style={styles.debugButton} onPress={handleDebugDatabase}>
  <Text variant="bodySmall" color="primary">
    🔍 Debug DB
  </Text>
</TouchableOpacity>
```
