// Customer Management Desktop Application — Tauri v2 backend

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // File system access plugin (scoped to appDataDir via capabilities)
        .plugin(tauri_plugin_fs::init())
        // Native OS dialog plugin (file picker, etc.)
        .plugin(tauri_plugin_dialog::init())
        // SQLite database plugin
        .plugin(tauri_plugin_sql::Builder::default().build())
        // Shell opener for external links
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
