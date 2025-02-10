use crate::api::Task;
use itertools::Itertools;
use native_db::{Database, Models};
use once_cell::sync::Lazy;
use tauri::Manager;
use crate::api::v1::TaskKey;

// Define models for the database / application
pub(crate) mod api {
    use native_db::{native_db, ToKey};
    use native_model::{native_model, Model};
    use serde::{Deserialize, Serialize};

    pub type Task = v1::Task;

    pub mod v1 {
        use super::*;

        #[derive(Serialize, Deserialize, Debug)]
        #[native_model(id = 1, version = 1)]
        #[native_db]
        pub struct Task {
            #[primary_key]
            pub key: String,
            #[secondary_key]
            pub date: String,
            pub name: String,
            pub body: String,
            pub priority: i8,
            pub completed: bool
        }
    }
}

static DATABASE_MODELS: Lazy<Models> = Lazy::new(|| {
    let mut models = Models::new();
    models.define::<api::v1::Task>().unwrap();
    models
});


#[tauri::command]
fn save_task(task: Task, db: tauri::State<Database>) {
    let rw = db
        .rw_transaction()
        .expect("failed to create rw transaction");
    rw.insert(task).expect("failed to save task");
    rw.commit().expect("failed to commit");
    println!("saved task successfully");
}

#[tauri::command]
fn load_tasks(db: tauri::State<Database>) -> Vec<Task> {
    let r = db.r_transaction().expect("failed to create ro transaction");

    let tasks = r
        .scan()
        .primary()
        .unwrap()
        .all()
        .unwrap()
        .try_collect()
        .unwrap();
    tasks
}

#[tauri::command]
fn load_tasks_by_date(date: &str, db: tauri::State<Database>) -> Vec<Task> {
    let r = db.r_transaction().expect("failed to create ro transaction");
    println!("date: {}", date);
    let tasks = r
        .scan()
        .secondary::<Task>(TaskKey::date)
        .unwrap()
        .start_with(date)
        .unwrap()
        .try_collect()
        .unwrap();
    tasks
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn main() {
    // Create a database in memory
    let db = native_db::Builder::new()
        .create_in_memory(&DATABASE_MODELS)
        .unwrap();

    // Insert some data
    let rw = db
        .rw_transaction()
        .expect("failed to create rw transaction");

    rw.insert(Task {
            key: "test_key_1".to_string(),
            name: "Do something you need to".to_string(),
            body: "nothing :)".to_string(),
            priority: 5,
            date: "2024-12-01".to_string(),
            completed: true       
    }).expect("failed to insert task 2");

    rw.insert(Task {
            key: "test_key_2".to_string(),
            name: "Do something else you need to".to_string(),
            body: "nothing here either".to_string(),
            priority: 3,
            date: "2025-02-10".to_string(),
            completed: false
    }).expect("failed to insert task 2");

    
    rw.insert(Task {
            key: "test_key_3".to_string(),
            name: "take out the trash".to_string(),
            body: "blank".to_string(),
            priority: 3,
            date: "2025-02-10".to_string(),
            completed: true
    }).expect("failed to insert task 3");

    rw.commit().expect("failed to commit");

    tauri::Builder::default()
        .setup(move |app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
              let window = app.get_webview_window("main").unwrap();
              // window.open_devtools();
              // window.close_devtools();
            }
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_task, 
            load_tasks,
            load_tasks_by_date
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
