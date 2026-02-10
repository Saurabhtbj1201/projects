import { useMemo, useRef, lazy, Suspense } from "react";
import "react-quill/dist/quill.snow.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Lazy load ReactQuill to avoid SSR/constructor issues
const ReactQuill = lazy(() => import("react-quill"));

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const quillRef = useRef<any>(null);

  const imageHandler = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Validate file size (max 500KB)
      if (file.size > 500 * 1024) {
        alert("Image must be smaller than 500KB");
        return;
      }

      try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("project-images")
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("project-images")
          .getPublicUrl(data.path);

        const quill = quillRef.current?.getEditor?.();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", urlData.publicUrl);
          quill.setSelection(range.index + 1, 0);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image");
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "blockquote", "code-block"],
          [{ color: [] }, { background: [] }],
          ["clean"],
        ],
      },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "blockquote",
    "code-block",
    "color",
    "background",
    "image",
  ];

  return (
    <div className="rich-text-editor">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[200px] border rounded-md bg-muted/50">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="bg-background rounded-md border-input"
        />
      </Suspense>
      <style>{`
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border-color: hsl(var(--input));
          background: hsl(var(--muted));
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border-color: hsl(var(--input));
          font-family: inherit;
          font-size: 0.875rem;
          min-height: 150px;
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
