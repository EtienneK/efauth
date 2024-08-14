export default function Home() {
  return (
    <>
      <div className="navbar bg-base-300 w-full">
        <div className="flex-none lg:hidden">
          <label
            htmlFor="my-drawer-3"
            aria-label="open sidebar"
            className="btn btn-square btn-ghost"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-6 w-6 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              >
              </path>
            </svg>
          </label>
        </div>

        <div className="flex-1">
          <a className="btn btn-ghost text-xl" href="/admin">
            <img className="w-10 h-10" src="/logo.svg" />
            EfAuth
          </a>
        </div>

        <div className="hidden flex-none">
          <ul className="menu menu-horizontal">
            {/* Navbar menu content here */}
            <li>
              <a>Navbar Item 1</a>
            </li>
            <li>
              <a>Navbar Item 2</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="drawer lg:drawer-open">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          <div className="md:container md:mx-auto p-5">
            <p>Content</p>
            <p>Content</p>
          </div>
        </div>

        <div className="drawer-side lg:h-[calc(100dvh-4rem)]">
          <label
            htmlFor="my-drawer-3"
            aria-label="close sidebar"
            className="drawer-overlay"
          >
          </label>
          <ul className="menu bg-base-200 min-h-full w-80 p-4">
            {/* Sidebar content here */}
            <li>
              <a>Sidebar Item 1</a>
            </li>
            <li>
              <a>Sidebar Item 2</a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
