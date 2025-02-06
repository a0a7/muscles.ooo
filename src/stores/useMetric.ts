import { writable } from 'svelte/store';

const isClient = typeof window !== 'undefined';
const savedUnit = isClient ? localStorage.getItem('useMetric') : null;
export const useMetric = writable(savedUnit !== null ? JSON.parse(savedUnit) : true);

if (isClient) {
    useMetric.subscribe(value => {
        localStorage.setItem('useMetric', JSON.stringify(value));
    });
}