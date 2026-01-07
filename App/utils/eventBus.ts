type Listener = (data?: any) => void;

const listeners: Record<string, Listener[]> = {};

export const eventBus = {
    on: (event: string, cb: Listener) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
        return () => {
            listeners[event] = listeners[event].filter(l => l !== cb);
        };
    },
    emit: (event: string, data?: any) => {
        (listeners[event] || []).forEach(cb => {
            try { cb(data); } catch (e) { console.error('eventBus handler error', e); }
        });
    },
    off: (event: string, cb?: Listener) => {
        if (!cb) {
            delete listeners[event];
        } else {
            listeners[event] = (listeners[event] || []).filter(l => l !== cb);
        }
    }
};
