"use client";

export default function EmailForm() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Notifícame cuando esté listo
      </h2>
      <form 
        className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
        onSubmit={(e) => {
          e.preventDefault();
          // Aquí puedes agregar lógica para guardar el email
          alert("¡Gracias! Te notificaremos cuando el sitio esté disponible.");
        }}
      >
        <input
          type="email"
          placeholder="Tu email"
          required
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
        >
          Notificar
        </button>
      </form>
    </div>
  );
}

