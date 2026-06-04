"use client";

import { useState, FormEvent } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
    setEmail("");
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ingrese su correo"
          required
          className="min-w-0 flex-1 rounded-none border border-neutral-0/20 bg-transparent px-4 py-2.5 text-sm text-neutral-0 placeholder:text-neutral-500 focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-none bg-brand-500 px-5 py-2.5 text-sm font-semibold text-neutral-0 hover:bg-brand-600 transition-colors"
        >
          Enviar
        </button>
      </form>
      {sent && (
        <p className="mt-3 text-sm text-brand-400">¡Gracias por suscribirte!</p>
      )}
    </div>
  );
}
