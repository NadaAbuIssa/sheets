'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function TestSidebar() {
    const pathname = usePathname();
    const [count, setCount] = useState(0);

    return (
        <div className="fixed bottom-0 right-0 bg-red-500 text-white p-4 z-50">
            <p>Path: {pathname}</p>
            <p>Count: {count}</p>
            <button onClick={() => setCount(c => c + 1)}>Inc</button>
        </div>
    );
}
