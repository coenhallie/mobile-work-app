use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, State, AppHandle, Manager, Window, command, Emitter,
};
use serde::Serialize;
use std::sync::Mutex;

// State to store FCM configuration
pub struct FcmState {
    project_id: Mutex<Option<String>>,
    initialized: Mutex<bool>,
    device_token: Mutex<Option<String>>,
}

// Response types
#[derive(Serialize)]
pub struct InitResponse {
    success: bool,
    device_token: Option<String>,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct PermissionResponse {
    granted: bool,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct TokenResponse {
    success: bool,
    token: Option<String>,
    error: Option<String>,
}

// Command parameters (removed - using direct parameters now)

// Initialize FCM SDK
#[command]
async fn init_fcm<R: Runtime>(
    _app_handle: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, FcmState>,
    project_id: String,
) -> Result<InitResponse, String> {
    let mut project_id_state = state.project_id.lock().map_err(|e| e.to_string())?;
    let mut initialized = state.initialized.lock().map_err(|e| e.to_string())?;
    
    if *initialized {
        let device_token = state.device_token.lock().map_err(|e| e.to_string())?;
        return Ok(InitResponse {
            success: true,
            device_token: device_token.clone(),
            error: None,
        });
    }
    
    // Store the project ID
    *project_id_state = Some(project_id.clone());
    
    // In a real implementation, this would call the native FCM SDK
    // For now, we'll simulate initialization and generate a mock token
    let mock_token = format!("fcm_token_{}", uuid::Uuid::new_v4().to_string().replace("-", "")[..16].to_string());
    
    {
        let mut device_token = state.device_token.lock().map_err(|e| e.to_string())?;
        *device_token = Some(mock_token.clone());
    }
    
    *initialized = true;
    
    // Return success response
    Ok(InitResponse {
        success: true,
        device_token: Some(mock_token),
        error: None,
    })
}

// Request notification permission
#[command]
async fn request_permission<R: Runtime>(
    _app_handle: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, FcmState>,
) -> Result<PermissionResponse, String> {
    let initialized = state.initialized.lock().map_err(|e| e.to_string())?;
    
    if !*initialized {
        return Err("FCM not initialized".to_string());
    }
    
    // In a real implementation, this would call the native FCM SDK
    // For now, we'll just simulate success
    
    Ok(PermissionResponse {
        granted: true,
        error: None,
    })
}

// Get FCM device token
#[command]
async fn get_device_token<R: Runtime>(
    _app_handle: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, FcmState>,
) -> Result<TokenResponse, String> {
    let initialized = state.initialized.lock().map_err(|e| e.to_string())?;
    
    if !*initialized {
        return Err("FCM not initialized".to_string());
    }
    
    let device_token = state.device_token.lock().map_err(|e| e.to_string())?;
    
    Ok(TokenResponse {
        success: true,
        token: device_token.clone(),
        error: None,
    })
}

// Register device token with backend
#[command]
async fn register_device_token<R: Runtime>(
    _app_handle: AppHandle<R>,
    _window: Window<R>,
    state: State<'_, FcmState>,
    _user_id: String,
    device_token: String,
) -> Result<InitResponse, String> {
    let initialized = state.initialized.lock().map_err(|e| e.to_string())?;
    
    if !*initialized {
        return Err("FCM not initialized".to_string());
    }
    
    // In a real implementation, this would register the token with your backend
    // For now, we'll just simulate success
    
    Ok(InitResponse {
        success: true,
        device_token: Some(device_token),
        error: None,
    })
}

// Handle notification received (called from native side)
#[command]
async fn handle_notification_received<R: Runtime>(
    app_handle: AppHandle<R>,
    _window: Window<R>,
    notification_data: serde_json::Value,
) -> Result<(), String> {
    // Emit event to frontend
    app_handle.emit("fcm-notification-received", &notification_data)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

// Handle notification clicked (called from native side)
#[command]
async fn handle_notification_clicked<R: Runtime>(
    app_handle: AppHandle<R>,
    _window: Window<R>,
    notification_data: serde_json::Value,
) -> Result<(), String> {
    // Emit event to frontend
    app_handle.emit("fcm-notification-clicked", &notification_data)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

// Create the plugin
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("fcm")
        .invoke_handler(tauri::generate_handler![
            init_fcm,
            request_permission,
            get_device_token,
            register_device_token,
            handle_notification_received,
            handle_notification_clicked,
        ])
        .setup(|app, _api| {
            // Note: For now, we're using a mock implementation
            // In a production app, you would register the actual FCM plugins here
            
            #[cfg(target_os = "android")]
            {
                println!("FCM plugin setup for Android (mock implementation)");
            }
            
            #[cfg(target_os = "ios")]
            {
                println!("FCM plugin setup for iOS (mock implementation)");
            }
            
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                println!("FCM plugin setup for desktop (mock implementation)");
            }
            
            app.manage(FcmState {
                project_id: Mutex::new(None),
                initialized: Mutex::new(false),
                device_token: Mutex::new(None),
            });
            Ok(())
        })
        .build()
}