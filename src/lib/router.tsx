import {
    useEffect,
    useState,
    type AnchorHTMLAttributes,
    type ReactNode,
} from "react";
export function hrefFor(path: string) {
    return `#${path}`;
}
export function Link({
    href,
    children,
    ...props
}: { href: string; children: ReactNode } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
>) {
    return (
        <a href={hrefFor(href)} {...props}>
            {children}
        </a>
    );
}
export function useRoute() {
    const read = () => location.hash.replace(/^#/, "") || "/";
    const [route, setRoute] = useState(read);
    useEffect(() => {
        const fn = () => setRoute(read());
        addEventListener("hashchange", fn);
        return () => removeEventListener("hashchange", fn);
    }, []);
    return route;
}
export function navigate(path: string) {
    location.hash = hrefFor(path);
}
