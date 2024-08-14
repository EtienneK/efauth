import { useState } from "preact/hooks";
import { client } from "../../trpc/client/interactions.ts";

interface UsernamePasswordProps {
  uid: string;
}

export default function UsernamePassword(props: UsernamePasswordProps) {
  const { uid } = props;

  const [error, setError] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function login(event: SubmitEvent) {
    event.preventDefault();
    setError(undefined);

    try {
      const result = await client(`/interactions/${uid}/trpc`).login
        .mutate({
          usernameOrEmail: username,
          password: password,
        });

      if (!result) {
        setError("Invalid username or password. Please try again.");
        return;
      }
      window.location.href = result.redirectTo;
    } catch (err) {
      console.error(err);
      setError("An unknown error has occurred.");
    }
  }

  return (
    <>
      <h2 className="card-title mt-2 mb-2">Welcome</h2>
      <p>
        Username / Password: admin / admin
      </p>

      {error
        ? (
          <div role="alert" className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )
        : undefined}

      <form className="w-full max-w-xs" onSubmit={login}>
        <label class="input input-bordered flex items-center gap-2 w-full max-w-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="h-4 w-4"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input
            type="text"
            class="grow"
            placeholder="Username or email address"
            value={username}
            onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
            required
          />
        </label>

        <label className="input input-bordered flex items-center gap-2 w-full max-w-xs mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="password"
            className="grow"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
          />
        </label>

        <button type="submit  " className="btn btn-primary w-full mt-2">
          Login
        </button>
      </form>
    </>
  );
}
