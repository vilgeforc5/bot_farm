import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return <Sonner richColors theme="light" toastOptions={{ duration: 3500 }} {...props} />;
}
