import { PecsBoard } from './types';

export function generateUUID(): string {
    // Simple UUID v4 generator that works in all environments including mobile
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// --- Import/Export Utilities ---

const convertUrlToBase64 = async (url: string): Promise<string> => {
    // If already base64, return as is
    if (url.startsWith('data:')) return url;

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Failed to convert image to base64:", url, error);
        return url; // Fallback to original URL if fetch fails
    }
};

export const exportBoard = async (board: PecsBoard) => {
    // Deep copy to avoid mutating state
    const boardToExport = JSON.parse(JSON.stringify(board));

    // Convert all card images to Base64
    for (const card of boardToExport.cards) {
        if (card.imageUrl) {
            card.imageUrl = await convertUrlToBase64(card.imageUrl);
        }
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(boardToExport));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${board.title.replace(/\s+/g, '_')}_board.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

export const validateBoard = (data: any): data is PecsBoard => {
    if (!data || typeof data !== 'object') return false;

    // Basic schema check
    const requiredFields = ['id', 'title', 'cards', 'gridColumns'];
    const hasFields = requiredFields.every(field => field in data);

    if (!hasFields) return false;
    if (!Array.isArray(data.cards)) return false;

    return true;
};
