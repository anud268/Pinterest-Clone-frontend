import React from 'react';
import Settings from '../Pages/Settings';
import Scrollbar from 'react-scrollbars-custom';

export default function ShortKeys() {
  const shortcuts = [
    { key: "H", description: "Navigate to Home Feed" },
    { key: "P", description: "Go to Profile page" },
    { key: "S", description: "Open Settings page" },
    { key: "C", description: "Open Create Pin page" },
    { key: "E", description: "Navigate to Explore page" },
    { key: "/", description: "Focus Search box" },
    { key: "Shift + K", description: "Check your shortkeys" },
    // { key: "Esc", description: "Close active menus or popups" },
  ];

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh' }}>
      <div className="flex bg-neutral-50/30 min-h-screen">
        {/* Settings Sidebar Wrapper */}
        <div>
          <Settings page={'shortkeys'} />
        </div>

        {/* Shortcuts content panel */}
        <div className="w-screen ml-[20%] p-8">
          <div className="text-black rounded-2xl relative max-w-3xl">

            {/* Header */}
            <div className="mb-8">
              <h2 className="font-bold text-3xl text-neutral-800 tracking-tight mb-2">
                Keyboard Shortcuts
              </h2>
              <p className="text-neutral-500 text-sm">
                Use these keyboard shortcuts to navigate faster and perform key actions across the application.
              </p>
            </div>

            {/* Shortcuts List Card */}
            <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm">
              <div className="divide-y divide-neutral-100">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-4 first:pt-0 last:pb-0 hover:bg-neutral-50/50 px-2 rounded-xl transition-colors duration-150"
                  >
                    <span className="text-sm font-semibold text-neutral-700">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center">
                      <kbd className="inline-flex items-center justify-center min-w-8 h-8 px-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 font-mono text-sm font-bold rounded-lg shadow-sm transition-colors duration-100">
                        {shortcut.key}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Notice */}
            <div className="mt-8 bg-gray-100 border border-gray-200 rounded-2xl p-4 text-xs text-red-700 leading-relaxed font-medium">
              Shortcuts are active globally across the app, except when you are typing inside input fields, text areas, or editable content areas.
            </div>

          </div>
        </div>
      </div>
    </Scrollbar>
  );
}
