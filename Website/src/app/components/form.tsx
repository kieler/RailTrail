import React from "react";

/**
 * A component that wraps any Form, giving them a consistent appearance.
 *
 * @param children The actual page this layout should wrap. In JSX, these are the
 *                 children of this element.
 * @constructor
 */
export function FormWrapper({children}: { children: React.ReactNode }) {
    return (
        <main className="mx-auto max-w-2xl w-full grow">
            <div className={'bg-white dark:bg-slate-800 dark:text-white p-4 rounded'}>
                {children}
            </div>
        </main>
    )
}

// TODO: create a component for a form in a dialog to replace/refactor
//  the LoginDialog and SelectionDialog components.