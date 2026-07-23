import { NextResponse } from "next/server";

export const dynamicHeaders = {
  "cache-control": "no-store",
};

export function json(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...dynamicHeaders, ...init.headers },
  });
}

export function badRequest(error: unknown) {
  return json(
    { error: error instanceof Error ? error.message : "Invalid request" },
    { status: 400 },
  );
}
