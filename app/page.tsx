import Chat from "@/components/Chat";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
          Z
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">
            ZekerbijOntslag.nl
          </p>
          <p className="text-xs text-gray-500">Gratis juridische intake</p>
        </div>
      </header>

      {/* Chat */}
      <div className="w-full max-w-2xl flex-1 flex flex-col">
        <Chat />
      </div>
    </main>
  );
}
