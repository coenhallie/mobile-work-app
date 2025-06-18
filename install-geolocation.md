# Installing Tauri Geolocation Plugin

## 1. Add Rust Dependency

Add to `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri-plugin-geolocation = "2.0.0"
```

## 2. Install JavaScript Bindings

```bash
npm add @tauri-apps/plugin-geolocation
```

## 3. Register Plugin in Rust

Add to `src-tauri/src/lib.rs` or `src-tauri/src/main.rs`:

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_geolocation::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 4. Add Permissions

Update `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    "core:default",
    "geolocation:allow-check-permissions",
    "geolocation:allow-request-permissions",
    "geolocation:allow-get-current-position",
    "geolocation:allow-watch-position"
  ]
}
```

Update `src-tauri/capabilities/mobile.json`:

```json
{
  "permissions": [
    "core:default",
    "geolocation:allow-check-permissions",
    "geolocation:allow-request-permissions",
    "geolocation:allow-get-current-position",
    "geolocation:allow-watch-position"
  ]
}
```

## 5. Android Permissions

For Android, add to `src-tauri/gen/android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```
