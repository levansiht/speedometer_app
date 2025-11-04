# Test App trên Android Thật

## 🚀 Chuẩn bị

### 1. Bật Developer Options trên Android:

```
Settings → About Phone → Tap "Build number" 7 lần
```

### 2. Bật USB Debugging:

```
Settings → Developer Options → USB Debugging → ON
```

### 3. Kết nối máy Android vào Mac qua USB

### 4. Verify device:

```bash
adb devices
# Phải thấy device của bạn
```

---

## 📦 Build & Install

### Option A: Development Build (có hot reload, debug)

```bash
# Cài app lên Android device
npx expo run:android --device
```

### Option B: Production Build (test như user thật)

```bash
# Build APK
eas build --profile production --platform android

# Sau khi build xong, tải APK về và cài vào máy
```

---

## ✅ Test Checklist

### 1. **Permissions**

- [ ] Location permission → Chọn "Allow all the time"
- [ ] Notification permission → Allow

### 2. **GPS & Speed**

- [ ] Mở app → Speedometer hiển thị tốc độ
- [ ] Đi xe/đi bộ → Tốc độ thay đổi chính xác
- [ ] So sánh với speedometer xe hoặc Google Maps

### 3. **Maps & Route**

- [ ] Start trip
- [ ] Đi theo đường thật (không đi thẳng)
- [ ] Stop trip → Xem route
- [ ] Route có theo đường hay vẫn bay chim?

### 4. **Voice Announcements**

- [ ] Settings → Voice → Enable
- [ ] Start trip → Đi 1km
- [ ] Nghe có báo "1 km hoàn thành" không?
- [ ] Tiếng Việt hay tiếng Anh?

### 5. **Speed Alerts (Foreground)**

- [ ] Settings → Speed Alert → Enable (50 km/h)
- [ ] Start trip
- [ ] Đi xe > 50 km/h
- [ ] Màn hình có chuyển đỏ + âm thanh cảnh báo?

### 6. **🆕 Background Tracking**

- [ ] Start trip
- [ ] **Minimize app** (Home button, KHÔNG vuốt lên xóa)
- [ ] Nhìn notification bar → Có "Speedometer đang hoạt động"?
- [ ] Đi 1km → Có notification "🎉 1 km hoàn thành"?

### 7. **🆕 Background Speed Alert**

- [ ] Settings → Speed Alert → Enable (50 km/h)
- [ ] Start trip
- [ ] **Minimize app**
- [ ] Đi xe > 50 km/h
- [ ] Có notification "⚠️ Cảnh báo vượt tốc độ"?

### 8. **Compass**

- [ ] Di chuyển xe/đi bộ
- [ ] Compass (mũi tên) có quay đúng hướng không?

### 9. **Trip Recording**

- [ ] Start → Pause → Resume → Stop
- [ ] Xem History → Trip có lưu đúng không?
- [ ] Distance, duration, avg speed chính xác?

### 10. **Export**

- [ ] Mở Trip History
- [ ] Chọn 1 trip → Export CSV
- [ ] Export GPX
- [ ] File có tạo ra không?

---

## 🐛 Các lỗi thường gặp

### **Lỗi 1: "Location permission denied"**

```
Fix: Settings → Apps → Speedometer → Permissions → Location → "Allow all the time"
```

### **Lỗi 2: Background không hoạt động**

```
Fix:
1. Check foreground notification có hiện không
2. Settings → Battery → Speedometer → Unrestricted
3. Đảm bảo không force close app (vuốt lên xóa)
```

### **Lỗi 3: Speed không chính xác**

```
- GPS cần thời gian khởi động (đợi 30s-1 phút)
- Đi ra ngoài trời, tránh hầm xe, tòa nhà cao
- Tốc độ < 5 km/h sẽ hiển thị 0 (filter noise)
```

### **Lỗi 4: Maps không hiển thị**

```
- Check Google Maps API key
- Check Bundle ID đã add vào API key chưa
- Check internet connection
```

### **Lỗi 5: Voice không nói**

```
- Check volume điện thoại
- Settings → Voice → Test voice
- Nếu không có tiếng Việt → sẽ nói tiếng Anh
```

---

## 📊 So sánh với yêu cầu ban đầu

| Yêu cầu                      | Status | Note                        |
| ---------------------------- | ------ | --------------------------- |
| Speedometer realtime         | ✅     | Với speed filter            |
| GPS tracking                 | ✅     | MIN_DISTANCE = 2m           |
| Maps hiển thị route          | ✅     | Theo đường thật             |
| Compass                      | ✅     | Heading realtime            |
| Voice announcements          | ✅     | Vietnamese/English fallback |
| Speed alerts                 | ✅     | Foreground + Background     |
| Trip recording               | ✅     | Start/Pause/Resume/Stop     |
| Export CSV/GPX               | ✅     | Full data export            |
| **Background tracking**      | ✅     | **Mới thêm**                |
| **Background notifications** | ✅     | **Mới thêm**                |

---

## 🎯 Kết quả mong đợi

### **Chức năng chính:**

- ✅ Tốc độ chính xác (±2 km/h)
- ✅ Route theo đường thật
- ✅ Voice báo km
- ✅ Cảnh báo vượt tốc độ

### **Chức năng nền:**

- ✅ Minimize app → Vẫn tracking
- ✅ Notification mỗi 1km
- ✅ Cảnh báo tốc độ khi ở nền
- ✅ Tắt màn hình → Vẫn hoạt động

---

## 📝 Ghi chú

- **Foreground service** chạy liên tục → Tốn pin
- **Force close** app → Service stops → Không tracking nữa
- **Google Maps API key** cần bundle ID restrictions
- **GPS** cần internet để improve accuracy (A-GPS)

---

## 🚨 Nếu có lỗi

Gửi cho tôi:

1. Screenshot lỗi
2. Logcat: `adb logcat | grep -i speedometer`
3. Describe bước reproduce lỗi
