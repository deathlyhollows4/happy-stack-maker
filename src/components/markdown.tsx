import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { ErrorBoundary } from "@/components/error-boundary";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <ErrorBoundary fallback={<p className="text-red-500">Could not render content</p>}>
    <div
      className={`text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-1 [&_code]:font-mono [&_code]:bg-accent/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_pre]:bg-secondary [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:mb-2 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold ${className ?? ""}`}
    >
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
    </ErrorBoundary>
  );
}
