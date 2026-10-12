"use client";
import {
  createContext,
  useContext,
  useId,
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowUpRight, LoaderCircle } from "lucide-react";
export const Arrow = () => (
  <ArrowUpRight size={18} strokeWidth={1.4} aria-hidden="true" />
);
export const Fields = createContext<Record<string, string>>({});
export function Field({
  name,
  label,
  type = "text",
  options,
  required = false,
  defaultValue = "",
  hint,
  ...props
}: {
  name: string;
  label: string;
  type?: string;
  options?: readonly string[] | { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  const id = useId();
  const errors = useContext(Fields);
  const error = errors[name];
  const [show, setShow] = useState(false);
  const shared = {
    name,
    id,
    defaultValue,
    required,
    "aria-invalid": !!error,
    "aria-describedby": error || hint ? `${id}-help` : undefined,
    ...props,
  };
  return (
    <div className={`field ${type === "textarea" ? "wide" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {options ? (
        <select {...shared}>
          {options.map((o) => (
            <option
              key={typeof o === "string" ? o : o.value}
              value={typeof o === "string" ? o : o.value}
            >
              {typeof o === "string" ? o : o.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          className="resize-none"
          {...shared}
          rows={5}
          style={{ resize: "none" }}
        />
      ) : (
        <div className={type === "password" ? "password-wrap" : ""}>
          <input
            {...shared}
            type={type === "password" && show ? "text" : type}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          )}
        </div>
      )}
      {(error || hint) && (
        <span
          className={error ? "field-error" : "field-hint"}
          id={`${id}-help`}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}
export function Form({
  endpoint,
  method = "POST",
  children,
  label,
  onSuccess,
  transform,
  validate,
  submitRequest,
  multipart = false,
  className = "",
  extra,
}: {
  noValidate?: true;
  endpoint: string;
  method?: string;
  children: ReactNode;
  label: string;
  onSuccess?: (data: any) => void;
  transform?: (data: Record<string, any>) => Record<string, any>;
  validate?: (data: Record<string, any>) => Record<string, string>;
  submitRequest?: (data: Record<string, any>) => Promise<Response>;
  multipart?: boolean;
  className?: string;
  extra?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const key = useRef("");
  const inFlight = useRef(false);
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const pendingHref = useRef("");
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as HTMLElement).closest(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !link ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        !link.href.startsWith(location.origin)
      )
        return;
      const url = new URL(link.href);
      if (
        url.pathname.startsWith("/api/documents/") ||
        (url.pathname === location.pathname && url.search === location.search)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      pendingHref.current = url.pathname + url.search + url.hash;
      returnFocus.current = document.activeElement as HTMLElement;
      leaveDialog.current?.showModal();
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  const stay = () => {
    leaveDialog.current?.close();
    returnFocus.current?.focus();
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setFields({});
    setSaved(false);
    const form = event.currentTarget;
    if (!key.current) key.current = crypto.randomUUID();
    const data = new FormData(form);
    if (multipart) data.set("request_key", key.current);
    const values = Object.fromEntries(data);
    let payload: Record<string, any> = { ...values, request_key: key.current };
    if (transform) payload = transform(payload);
    try {
      const validation = validate?.(payload) || {};
      if (Object.keys(validation).length) {
        setFields(validation);
        setError("Check the highlighted fields.");
        requestAnimationFrame(() => {
          const element = form.elements.namedItem(Object.keys(validation)[0]);
          if (element instanceof HTMLElement) element.focus();
        });
        return;
      }
      const result = submitRequest
        ? await submitRequest(payload)
        : await fetch(endpoint, {
            method,
            headers: multipart ? {} : { "Content-Type": "application/json" },
            body: multipart ? data : JSON.stringify(payload),
            signal: AbortSignal.timeout(20000),
          });
      const response = await result.json();
      if (!result.ok) {
        setError(response.error || "Please try again.");
        setFields(response.fields || {});
        const first = Object.keys(response.fields || {})[0];
        if (first) {
          requestAnimationFrame(() => {
            const element = form.elements.namedItem(first);
            if (element instanceof HTMLElement) element.focus();
          });
        }
        return;
      }
      key.current = "";
      setDirty(false);
      setSaved(true);
      onSuccess?.(response);
    } catch {
      setError(
        "The connection was interrupted. Your details are still here. Please try again.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Fields.Provider value={fields}>
      <form
        noValidate
        onInput={() => setDirty(true)}
        onSubmit={submit}
        className={`studio-form ${className}`}
        aria-busy={busy}
      >
        {children}
        <div className="form-end">
          <div className="form-feedback" aria-live="polite">
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            {saved && !onSuccess && (
              <p className="success-message">Changes saved.</p>
            )}
          </div>
          <button className="button" disabled={busy} type="submit">
            {busy ? (
              <>
                <LoaderCircle size={17} className="spin" /> Please wait
              </>
            ) : (
              <>
                {label}
                <Arrow />
              </>
            )}
          </button>
          {extra}
        </div>
      </form>
      <dialog
        ref={leaveDialog}
        className="leave-dialog"
        aria-labelledby="leave-title"
        onCancel={() => returnFocus.current?.focus()}
      >
        <h2 id="leave-title">Leave your unsent details?</h2>
        <p>Your changes on this page have not been saved.</p>
        <div>
          <button type="button" className="button" autoFocus onClick={stay}>
            Keep editing
          </button>
          <button
            type="button"
            className="outline-button"
            onClick={() => {
              leaveDialog.current?.close();
              setDirty(false);
              router.push(pendingHref.current);
            }}
          >
            Leave page
          </button>
        </div>
      </dialog>
    </Fields.Provider>
  );
}
export function DateLabel({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))}
    </time>
  );
}
