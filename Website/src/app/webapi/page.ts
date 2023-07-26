import { notFound } from "next/navigation";

export default async function handler(request: any) {
    console.log('foo', request, typeof request)
    notFound()
    return;
}