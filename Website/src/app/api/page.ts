import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export default async function handler(request: any) {
    console.log('foo', request, typeof request)
    notFound()
    return;
}