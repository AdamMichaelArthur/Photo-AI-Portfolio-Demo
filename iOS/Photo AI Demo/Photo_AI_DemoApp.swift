//
//  Photo_AI_DemoApp.swift
//  Photo AI Demo
//
//  Created by Adam Arthur on 11/24/23.
//

import SwiftUI

@main
struct Photo_AI_DemoApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
