/** Keep a range input's fill aligned with its thumb after any value change. */
export function updateRangeFill(input) {
  const min = input.min === '' ? 0 : Number(input.min);
  const max = input.max === '' ? 100 : Number(input.max);
  const value = Number(input.value);
  const ratio = Number.isFinite(min) && Number.isFinite(max) && Number.isFinite(value) && max > min
    ? Math.min(1, Math.max(0, (value - min) / (max - min)))
    : 0;

  input.style.setProperty('--range-progress', `${ratio * 100}%`);
  input.style.setProperty('--range-ratio', `${ratio}`);
}
