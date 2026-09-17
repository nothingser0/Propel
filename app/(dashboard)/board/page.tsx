export default function BoardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Kanban Board</h1>
      <div className="grid grid-cols-3 gap-4">
        {/* Todo Column */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">To Do</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Belum ada task</p>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">In Progress</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Belum ada task</p>
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">Done</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Belum ada task</p>
          </div>
        </div>
      </div>
    </div>
  )
}
