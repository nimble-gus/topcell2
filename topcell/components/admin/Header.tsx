"use client";

import { Session } from "next-auth";

interface HeaderProps {
  user: Session["user"];
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Bienvenido, {user.name}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

