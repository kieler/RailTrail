
export const async_sleep: (time: number) => Promise<null> = (time) => new Promise((resolve, reject) => setTimeout(() => resolve(null), time))