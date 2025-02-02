import { writable } from 'svelte/store';

export const theme = writable('dark');

export function toggleTheme() {
    theme.update(currentTheme => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return newTheme;
    });
}