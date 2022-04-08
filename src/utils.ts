export const pause = (sec: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });
};
