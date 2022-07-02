export async function wait(duration: number): Promise<void> {
  return new Promise((r) => setTimeout(r, duration));
}
