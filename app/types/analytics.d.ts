// types/analytics.d.ts or add to globals.d.ts
interface Window {
    _analytics?: {
        track: () => void;
        siteId: string;
        initialized: boolean;
    };
}