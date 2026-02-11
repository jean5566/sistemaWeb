declare module '*.jsx' {
    const content: any;
    export default content;
    export const Modal: any;
}

declare module '../hooks/useCategories' {
    export const useCategories: () => { categories: any[], loading: boolean, error: any };
}
