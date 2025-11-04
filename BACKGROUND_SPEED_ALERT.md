# Background Speed Alert

## Tính năng mới thêm

**Cảnh báo vượt tốc độ khi app chạy nền** (minimize hoặc tắt màn hình)

## Cách hoạt động

### Khi tracking trong nền:

1. ✅ GPS vẫn hoạt động
2. ✅ Kiểm tra tốc độ liên tục
3. ✅ Gửi notification khi vượt tốc độ
4. ✅ Thông báo mỗi km vẫn hoạt động

### Điều kiện cảnh báo:

- ⚙️ Speed Alert phải **enabled** trong settings
- ⚙️ Tốc độ hiện tại > threshold
- ⏱️ Cách notification trước đó ít nhất **30 giây** (tránh spam)

### Notification format:

```
⚠️ Cảnh báo vượt tốc độ!
Tốc độ hiện tại: 85 km/h (Giới hạn: 80 km/h)
```

## Test

### Setup:

1. Mở app → Settings → Speed Alert
2. Enable speed alert
3. Set threshold (ví dụ: 50 km/h)
4. Start trip

### Test background alert:

```
1. Start trip
2. Enable speed alert (50 km/h)
3. Minimize app (Home button)
4. Đi xe > 50 km/h
5. Sẽ nhận notification cảnh báo
```

### Test foreground alert:

```
1. Start trip
2. Enable speed alert
3. Để app mở
4. Đi xe > threshold
5. Màn hình đỏ + notification
```

## Code Changes

### Files modified:

- ✅ `src/services/BackgroundLocationService.ts`

  - Added speed alert logic
  - Check speed every GPS update
  - Send notification if exceeds threshold

- ✅ `src/contexts/SpeedAlertContext.tsx`
  - Sync speed alert config to background service
  - Auto-update when user changes settings

### New functions:

```typescript
// Set speed alert for background
await setBackgroundSpeedAlert(enabled: boolean, threshold: number)

// Get current config
const { enabled, threshold } = await getBackgroundSpeedAlert()
```

## Limits

| Scenario     | Alert in Foreground | Alert in Background |
| ------------ | ------------------- | ------------------- |
| App open     | ✅ Yes              | N/A                 |
| Minimized    | ✅ Yes              | ✅ Yes              |
| Screen off   | N/A                 | ✅ Yes              |
| Force closed | ❌ No               | ❌ No               |

**Note:** Force close = Vuốt lên xóa app → service stops → no alerts

## Settings sync

Speed alert settings tự động sync giữa:

- ✅ Foreground alert (SpeedAlertContext)
- ✅ Background alert (BackgroundLocationService)
- ✅ AsyncStorage (persistent)

Khi user thay đổi threshold hoặc enable/disable → Background service tự động update!
