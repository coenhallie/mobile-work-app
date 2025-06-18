// COMMENTED OUT - OneSignal plugin replaced with FCM
// This file is kept for reference but should not be used

/*
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, State, AppHandle, Manager, Window, command,
};
use serde::{Serialize, Deserialize};
use std::sync::Mutex;

// State to store OneSignal configuration
pub struct OneSignalState {
    app_id: Mutex<Option<String>>,
    initialized: Mutex<bool>,
}

// Response types
#[derive(Serialize)]
pub struct InitResponse {
    success: bool,
    device_id: Option<String>,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct PermissionResponse {
    granted: bool,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct TagResponse {
    success: bool,
    error: Option<String>,
}

// Command parameters
#[derive(Deserialize)]
pub struct InitParams {
    app_id: String,
}

#[derive(Deserialize)]
pub struct TagParams {
    key: String,
    value: String,
}

// Initialize OneSignal SDK
#[command]
async fn init_onesignal<R: Runtime>(
    _app_handle: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, OneSignalState>,
    params: InitParams,
) -> Result<InitResponse, String> {
    let mut app_id = state.app_id.lock().map_err(|e| e.to_string())?;
    let mut initialized = state.initialized.lock().map_err(|e| e.to_string())?;
    
    if *initialized {
        return Ok(InitResponse {
            success: true,
            device_id: None, // In a real implementation, we would return the actual device ID
            error: None,
        });
    }
    
    // Store the app ID
    *app_id = Some(params.app_id.clone());
    
    // In a real implementation, this would call the native OneSignal SDK
    // For now, we'll just simulate success
    *initialized = true;
    
    // Return success response
    Ok(InitResponse {
        success: true,
        device_id: Some("simulated-device-id".to_string()),
        error: None,
    })
}

// Request notification permission
#[command]
async fn request_permission<R: Runtime>(
    _app_handle: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, OneSignalState>,
) -> Result<PermissionResponse, String> {
    let initialized = state.initialized.lock().map_err(|e| e.to_string())?;
    
    if !*initialized {
        return Err("OneSignal not initialized".to_string());
    }
    
    // In a real implementation, this would call the native OneSignal SDK
    // For now, we'll just simulate success
    
    Ok(PermissionResponse {
        granted: true,
        error: None,
    })
}

// Register device with backend
#[command]
async fn register_device<R: Runtime>(
    _app_handle: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, OneSignalState>,
    _user_id: String,
) -> Result<InitResponse, String> {
    let initialized = state.initialized.lock().map_err(|e| e.to_string())?;
    
    if !*initialized {
        return Err("OneSignal not initialized".to_string());
    }
    
    // In a real implementation, this would call the native OneSignal SDK
    // to link the OneSignal user ID with your app's user ID
    
    Ok(InitResponse {
        success: true,
        device_id: Some("simulated-device-id".to_string()),
        error: None,
    })
}

// Send tag for user segmentation
#[command]
async fn send_tag<R: Runtime>(
    _app_handle: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, OneSignalState>,
    _params: TagParams,
) -> Result<TagResponse, String> {
    let initialized = state.initialized.lock().map_err(|e| e.to_string())?;
    
    if !*initialized {
        return Err("OneSignal not initialized".to_string());
    }
    
    // In a real implementation, this would call the native OneSignal SDK
    
    Ok(TagResponse {
        success: true,
        error: None,
    })
}

// Create the plugin
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("onesignal")
        .invoke_handler(tauri::generate_handler![
            init_onesignal,
            request_permission,
            register_device,
            send_tag,
        ])
        .setup(|app, api| {
            // Register the Android plugin if on Android
            #[cfg(target_os = "android")]
            {
                // Register the Android plugin
                api.register_android_plugin("com.tauri.onesignal", "OneSignalPlugin")?;
                println!("Registered Android OneSignal plugin");
            }
            
            // Register the iOS plugin if on iOS
            #[cfg(target_os = "ios")]
            {
                // iOS plugin registration would go here
                println!("iOS OneSignal plugin registration not implemented yet");
            }
            
            app.manage(OneSignalState {
                app_id: Mutex::new(None),
                initialized: Mutex::new(false),
            });
            Ok(())
        })
        .build()
}
*/

// Placeholder to prevent compilation errors
use tauri::{plugin::{Builder, TauriPlugin}, Runtime};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("onesignal")
        .build()
}