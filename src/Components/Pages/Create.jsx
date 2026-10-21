import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { IoCloseSharp, IoCloudUploadOutline, IoLockClosedOutline } from "react-icons/io5";
import { FiLink, FiMapPin, FiTag } from "react-icons/fi";
import { api, errorMessage } from "../../lib/api";
import { toast } from "../../lib/toast";
import { useDebouncedValue, useDocumentTitle } from "../../lib/hooks";
import { selectUser } from "../Redex/Slice/UserSlice";
import { feedReset } from "../Redex/Slice/PostSlice";
import Button from "../UI/Button";
import { buttonClass } from "../UI/buttonClass";
import { Alert, TextField } from "../UI/Field";
import EmptyState from "../UI/EmptyState";
import { PageSpinner } from "../UI/Spinner";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_TAGS = 10;

const schema = yup.object({
  title: yup.string().trim().required("Give your pin a title").max(100, "Keep the title under 100 characters"),
  description: yup.string().trim().required("Add a short description").max(1000, "Keep the description under 1000 characters"),
  url: yup
    .string()
    .trim()
    .test("url", "Enter a full link starting with http:// or https://", (value) => !value || /^https?:\/\/\S+\.\S+/.test(value)),
  location: yup.string().trim().max(100, "Keep the location under 100 characters"),
});

const validateFile = (file) => {
  if (!ACCEPTED.includes(file.type)) return "Please choose a JPEG, PNG, WebP, GIF or AVIF image.";
  if (file.size > MAX_BYTES) return "Images must be 5MB or smaller.";
  return null;
};

// "summer vibes" -> "#summer_vibes"
const toTag = (value) => {
  const cleaned = value.trim().replace(/^#+/, "").replace(/\s+/g, "_").replace(/[^\w]/g, "").slice(0, 40);
  return cleaned ? `#${cleaned}` : null;
};

function TagInput({ tags, onChange, disabled }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const debounced = useDebouncedValue(input.trim().replace(/^#/, ""), 250);

  useEffect(() => {
    if (!debounced) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    api
      .get(`/applytag/${encodeURIComponent(debounced)}`, { signal: controller.signal })
      .then(({ data }) => setSuggestions(data.tags))
      .catch(() => {});
    return () => controller.abort();
  }, [debounced]);

  const add = (value) => {
    const tag = toTag(value);
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    onChange([...tags, tag]);
    setInput("");
    setSuggestions([]);
  };

  const visibleSuggestions = suggestions.filter((s) => !tags.includes(s)).slice(0, 6);

  return (
    <div>
      <label htmlFor="tag-input" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
        <FiTag aria-hidden="true" /> Tags <span className="font-normal text-ink-subtle">({tags.length}/{MAX_TAGS})</span>
      </label>
      <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-white p-1.5 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface py-1 pr-1 pl-3 text-sm font-semibold">
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
                className="rounded-full p-1 text-ink-muted hover:bg-surface-strong hover:text-ink cursor-pointer"
              >
                <IoCloseSharp aria-hidden="true" />
              </button>
            )}
          </span>
        ))}
        <input
          id="tag-input"
          type="text"
          value={input}
          disabled={disabled || tags.length >= MAX_TAGS}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && input.trim()) {
              e.preventDefault();
              add(input);
            } else if (e.key === "Backspace" && !input && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          placeholder={tags.length >= MAX_TAGS ? "Tag limit reached" : "Type a tag and press Enter"}
          aria-describedby="tag-hint"
          className="h-9 min-w-40 flex-1 bg-transparent px-2 text-sm placeholder:text-ink-subtle focus:outline-none"
        />
      </div>
      <p id="tag-hint" className="mt-1.5 text-xs text-ink-subtle">
        Tags help people find your pin. Letters, numbers and underscores only.
      </p>
      {visibleSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggested tags">
          {visibleSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-ink-muted hover:border-ink hover:text-ink cursor-pointer"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageDrop({ preview, onFile, onClear, error, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-surface">
        <img src={preview} alt="Selected pin image" className="max-h-[70vh] w-full object-contain" />
        {!disabled && (
          <div className="absolute top-3 right-3 flex gap-2">
            <Button variant="overlay" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <button
              type="button"
              onClick={onClear}
              aria-label="Remove image"
              className="flex size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-card hover:bg-white cursor-pointer"
            >
              <IoCloseSharp aria-hidden="true" />
            </button>
          </div>
        )}
        <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="sr-only" tabIndex={-1} onChange={(e) => handleFiles(e.target.files)} />
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor="image-upload"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={`flex aspect-[3/4] max-h-[70vh] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 text-center transition-colors ${
          dragging ? "border-brand-600 bg-brand-50" : error ? "border-danger bg-brand-50/40" : "border-line bg-surface hover:border-ink-subtle"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-white text-2xl text-ink shadow-card" aria-hidden="true">
          <IoCloudUploadOutline />
        </span>
        <span className="text-base font-bold">Choose a file or drag it here</span>
        <span className="text-sm text-ink-muted">High-quality JPG, PNG, WebP or GIF up to 5MB. Tall images look best.</span>
      </label>
      <input
        ref={inputRef}
        id="image-upload"
        type="file"
        accept={ACCEPTED.join(",")}
        disabled={disabled}
        className="sr-only"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "image-error" : undefined}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <p id="image-error" className="mt-2 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function PinForm({ existing }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isEdit = Boolean(existing);
  const blocked = Boolean(user?.adminblock);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(existing?.postImage || "");
  const [imageError, setImageError] = useState(null);
  const [tags, setTags] = useState(existing?.tags || []);
  const [progress, setProgress] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Release the object URL created for local previews
  useEffect(() => () => preview.startsWith("blob:") && URL.revokeObjectURL(preview), [preview]);

  const chooseFile = (next) => {
    const problem = validateFile(next);
    if (problem) return setImageError(problem);
    setImageError(null);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const formik = useFormik({
    initialValues: {
      title: existing?.postTitle || "",
      description: existing?.postDescription || "",
      url: existing?.url || "",
      location: existing?.location || "",
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      if (!file && !isEdit) return setImageError("Add an image for your pin.");
      setSubmitError(null);
      const form = new FormData();
      if (file) form.append("image", file);
      Object.entries(values).forEach(([key, value]) => form.append(key, value.trim()));
      tags.forEach((tag) => form.append("tags", tag));

      try {
        setProgress(0);
        const { data } = await api.post(isEdit ? `/update/${existing._id}` : "/upload", form, {
          onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
        });
        dispatch(feedReset());
        toast.success(isEdit ? "Your pin was updated" : "Your pin is live!");
        navigate(`/post/${data.post._id}`, { replace: isEdit });
      } catch (error) {
        setSubmitError(errorMessage(error, "We couldn't publish your pin. Please try again."));
      } finally {
        setProgress(null);
      }
    },
  });

  const fieldProps = (name) => ({
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && formik.errors[name],
    disabled: blocked || formik.isSubmitting,
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{isEdit ? "Edit pin" : "Create a pin"}</h1>
          <p className="mt-1 text-sm text-ink-muted">{isEdit ? "Update the details of your pin." : "Share an idea with everyone."}</p>
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <Link to={`/post/${existing._id}`} className={buttonClass({ variant: "secondary" })}>
              Cancel
            </Link>
          )}
          <Button type="submit" size="lg" loading={formik.isSubmitting} disabled={blocked}>
            {isEdit ? "Save changes" : "Publish"}
          </Button>
        </div>
      </div>

      {blocked && (
        <Alert className="mb-6">Your account has been restricted by an administrator, so you can&apos;t create or edit pins.</Alert>
      )}
      {submitError && <Alert className="mb-6">{submitError}</Alert>}
      {progress !== null && (
        <div className="mb-6" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-ink-muted">
            <span>{progress < 100 ? "Uploading image…" : "Processing…"}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <ImageDrop
          preview={preview}
          onFile={chooseFile}
          onClear={() => {
            setFile(null);
            setPreview(isEdit ? existing.postImage : "");
          }}
          error={imageError}
          disabled={blocked || formik.isSubmitting}
        />

        <div className="flex flex-col gap-5">
          <TextField label="Title" required maxLength={100} placeholder="Add a title" hint={`${formik.values.title.length}/100`} {...fieldProps("title")} />
          <TextField
            label="Description"
            required
            multiline
            rows={4}
            maxLength={1000}
            placeholder="Tell everyone what your pin is about"
            hint={`${formik.values.description.length}/1000`}
            {...fieldProps("description")}
          />
          <TextField
            label={
              <span className="inline-flex items-center gap-1.5">
                <FiLink aria-hidden="true" /> Destination link
              </span>
            }
            type="url"
            inputMode="url"
            placeholder="https://example.com"
            {...fieldProps("url")}
          />
          <TextField
            label={
              <span className="inline-flex items-center gap-1.5">
                <FiMapPin aria-hidden="true" /> Location
              </span>
            }
            maxLength={100}
            placeholder="Add a place"
            {...fieldProps("location")}
          />
          <TagInput tags={tags} onChange={setTags} disabled={blocked || formik.isSubmitting} />
        </div>
      </div>
    </form>
  );
}

export default function Create() {
  const [params] = useSearchParams();
  const location = useLocation();
  const user = useSelector(selectUser);
  const editId = params.get("edit") || location.state?._id || null;
  const [existing, setExisting] = useState(null);
  const [status, setStatus] = useState(editId ? "loading" : "ready");
  const [error, setError] = useState(null);
  useDocumentTitle(editId ? "Edit pin" : "Create");

  useEffect(() => {
    if (!editId) {
      setExisting(null);
      setStatus("ready");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    api
      .get(`/viewpost/${editId}`, { signal: controller.signal })
      .then(({ data }) => {
        setExisting(data.post);
        setStatus("ready");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(err, "We couldn't load this pin."));
        setStatus("error");
      });
    return () => controller.abort();
  }, [editId]);

  if (status === "loading") return <PageSpinner label="Loading pin" />;
  if (status === "error") {
    return (
      <EmptyState
        title="We couldn't open this pin"
        description={error}
        action={
          <Link to="/create" className={buttonClass({ variant: "secondary" })}>
            Create a new pin instead
          </Link>
        }
      />
    );
  }
  if (existing && existing.userId?._id !== user?._id) {
    return <EmptyState icon={<IoLockClosedOutline />} title="You can only edit your own pins" />;
  }

  return <PinForm key={existing?._id ?? "new"} existing={existing} />;
}
