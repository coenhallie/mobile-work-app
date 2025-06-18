// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// Import our plugins module
mod plugins;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_haptics::init())
        .plugin(tauri_plugin_geolocation::init())
        // Initialize store plugin for secure storage
        .plugin(tauri_plugin_store::Builder::default().build());

    // Initialize mobile-specific plugins
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let builder = builder
        .plugin(tauri_plugin_biometric::init())
        .plugin(tauri_plugin_status_bar_color::init());

    builder
        // Add FCM plugin for push notifications
        .plugin(plugins::fcm::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
