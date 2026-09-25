/** Detail route for a task id — shared by the list rows and search results. */
export function taskDetailPath(taskId: string): string {
  return `/app/planning/tasks/${taskId}`
}
