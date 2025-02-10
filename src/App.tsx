import { Fragment, memo, useEffect, useMemo, useSignal } from "kaioken"
import { invoke } from "@tauri-apps/api/core"

interface ITodo {
  key: string,
  completed: boolean,
  body: string,
  name: string,
  priority: number,
  /** YYYY-MM-DD */
  date: string
}

export function App() {
  const todos = useSignal<ITodo[]>([])
  const priority = useSignal<number>(5)

  async function _handleSubmit(e: Event) {
    e.preventDefault()
    const t = e.target as HTMLFormElement & { 0: HTMLInputElement, 1: HTMLTextAreaElement }
    if (!t) return
    const { 0: titleInput, 1: descriptionTextarea } = t
    const title = titleInput.value, description = descriptionTextarea.value
    if (!title || !description) return
    await invoke("save_task", {
      task: {
        key: String(new Date().getUTCMilliseconds()),
        name: title,
        body: description,
        priority: priority.value,
        date: formatDate(new Date()),
        completed: false
      }
    })
    void getTasks()
  }

  function _getGreeting() {
    const date = new Date()
    const hour = date.getHours()
    if (hour < 12) return "Good Morning"
    if (hour >= 12 && hour < 3) return "Good Afternoon"
    return "Good Evening"
  }

  useEffect(() => {
    window.addEventListener("keypress", e => {
      const key = e.key
      const isCtrl = e.ctrlKey
      if (key !== 'n' || !isCtrl) return
      alert("Creating new hotkey here")
    })
  }, [])

  async function getTasks() {
    const tasks: ITodo[] = await invoke("load_tasks_by_date", {
      date: formatDate(new Date())
    })
    todos.value = tasks
  }

  useEffect(() => {
    void getTasks()
  }, [])

  return (
    <div className="bg-neutral-100 p-4 h-screen text-neutral-700" >
      <div className="gap-4 flex flex-col container m-auto max-w-xl max-h-full">
        <div className="flex flex-row justify-between items-end">
          <div>
            <h1 className="font-bold text-lg">{_getGreeting()}, Triston</h1>
            <p className="">{new Date().toDateString()}</p>
          </div>
          <button className="flex flex-row gap-2 py-1 px-2 flex flex-row items-center rounded bg-white cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-square-menu w-4"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 8h10" /><path d="M7 12h10" /><path d="M7 16h10" /></svg>
            <span className="">Today</span>
          </button>
        </div>

        {/* list of items */}
        <ul className="flex flex-col gap-1 pb-10 overflow-y-auto">
          {todos.value.sort((a, b) => a.priority - b.priority).sort((a, b) => Number(a.completed) - Number(b.completed)).map(x => <Todo data={x} />)}
          {!todos.value.length && <div className="bg-neutral-200 rounded p-2 text-center text-neutral-400">No Action Items Created Yet</div>}
        </ul>


        <button popoverTarget="create-new-popover" className="cursor-pointer bg-neutral-950 text-white absolute bottom-2 w-[300px] left-[calc(50vw-150px)] flex flex-row justify-between px-2 py-2 rounded-full items-center">
          <div className="flex flex-row items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-plus w-4"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
            <span className="text-sm">Create new task</span>
          </div>
          <div className="flex flex-row items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-6 h-6 bg-neutral-700 rounded-full text-white p-1.5"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /></svg>
            <span className="text-xs w-6 h-6 bg-neutral-700 rounded-full text-white flex flex-row justify-center items-center">N</span>
          </div>
        </button>

        <div popover id="create-new-popover" className="p-1 m-auto mb-15 w-[300px] rounded-lg shadow-xl transition-discrete starting:open:opacity-0">
          <form className="flex flex-col gap-1" onsubmit={_handleSubmit}>
            <input name="title" placeholder="create new task" className="bg-neutral-100 rounded-md py-2 px-2 text-sm" />
            <textarea rows="4" name="description" placeholder="some extra notes" className="bg-neutral-100 rounded-md py-2 px-2 text-sm" />
            <button className="cursor-pointer bg-neutral-200 rounded-full px-4 py-1 flex justify-between items-center" type="submit">
              <div className="flex items-center gap-2" >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-4"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                <span className="text-sm">Add priority</span>
              </div>
              <span className="text-sm bg-neutral-50 rounded-full w-5 h-5 flex flex-row items-center justify-center" onclick={e => {
                e.preventDefault()
                e.stopPropagation()
                if (priority.value == 5) return priority.value = 0
                priority.value++
              }}>{priority.value}</span>
            </button>
          </form>
        </div>
      </div >
    </div >
  )
}


function Todo({ data }: { data: ITodo }) {
  const Chip = memo(function({ priority }: { priority: number }) {
    if (data.priority == 0) return <span className={`w-6 h-2 rounded-full bg-red-500`} />
    if (data.priority == 1) return <span className={`w-6 h-2 rounded-full bg-orange-500`} />
    if (data.priority == 2) return <span className={`w-6 h-2 rounded-full bg-yellow-500`} />
    if (data.priority == 3) return <span className={`w-6 h-2 rounded-full bg-green-500`} />
    if (data.priority == 4) return <span className={`w-6 h-2 rounded-full bg-blue-500`} />
    if (data.priority == 5) return <span className={`w-6 h-2 rounded-full bg-purple-500`} />
    return <span className={`w-6 h-2 rounded-full`} />
  }, (prev, curr) => prev.priority !== curr.priority)


  return (
    <Fragment>
      <li >
        <button popoverTarget={"item-popover-" + data.key} className="rounded px-2 py-2 bg-white flex flex-row justify-between cursor-pointer pr-4 w-full">
          <div className="flex flex-row gap-2 items-center">
            <input type={'checkbox'} checked={data.completed} />
            <span className={"text-sm"}>{data.name}</span>
            <Chip priority={data.priority} />
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-square-menu w-5 h-5 text-neutral-300 hover:text-neutral-400"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
        </button>
      </li>

      <div popover id={"item-popover-" + data.key} className="w-full h-full p-10 bg-[#0005]">
        <div className=" flex flex-col gap-2 m-auto min-w-40 max-w-150 min-h-40 max-h-full rounded-xl shadow-lg p-4 bg-white py-2">
          <div>
            <h3 className={'font-bold'}>{data.name.split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(' ')}</h3>
            <small className={"text-xs text-neutral-600"}>{new Date(data.date).toDateString()}</small>
          </div>
          <hr className={"border-neutral-300 "} />
          <p className={"text-sm flex-1 bg-neutral-100 rounded-lg p-1 text-neutral-600"}>{data.body}</p>
          <Chip priority={data.priority} />
        </div>
      </div>
    </Fragment >
  )
}

function formatDate(date: Date) {
  const year = date.getFullYear(),
    month = date.getMonth() + 1,
    day = date.getDate()

  const newDate = `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`
  return newDate
}
